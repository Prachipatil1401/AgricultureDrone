import os
import io
from typing import Optional, Dict, Any, List

import streamlit as st
import requests
from PIL import Image, ImageDraw, ImageFont
import pandas as pd
from dotenv import load_dotenv

# Load environment variables (for ROBOFLOW_API_KEY)
load_dotenv()

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "")

st.set_page_config(page_title="Disease Detection with Roboflow", layout="centered")

st.title("Disease Detection using Roboflow")
st.caption("Upload an image. The app will call Roboflow's hosted inference endpoint for detection or classification.")

with st.expander("Configuration", expanded=False):
    st.write(
        "Provide your Roboflow project info. You can find these in your Roboflow dashboard under Deploy > Hosted API."
    )
    api_key = st.text_input("Roboflow API Key", value=ROBOFLOW_API_KEY, type="password")
    model_id = st.text_input(
        "Model ID (e.g., your-namespace/plant-disease/1)",
        help="Format: <workspace>/<project>/<version>. For classification/detection models."
    )
    task_type = st.selectbox("Task Type", ["auto", "detection", "classification"], index=0)

uploaded = st.file_uploader("Upload image", type=["jpg", "jpeg", "png"], accept_multiple_files=False)

run = st.button("Run Inference", type="primary", use_container_width=True)

@st.cache_data(show_spinner=False)
def _to_pil_image(file_bytes: bytes) -> Image.Image:
    return Image.open(io.BytesIO(file_bytes)).convert("RGB")


def build_inference_url(model_id: str, task_type: str) -> Optional[str]:
    # Roboflow Hosted API v1 style
    # https://docs.roboflow.com/inference/hosted-api
    # task type can usually be inferred; allow manual override
    if not model_id:
        return None
    if task_type == "classification":
        base = "https://classify.roboflow.com"
    else:
        base = "https://detect.roboflow.com"
    return f"{base}/{model_id}"


def call_roboflow(url: str, api_key: str, image: Image.Image, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    if params is None:
        params = {}
    params["api_key"] = api_key

    # Encode image as JPEG bytes
    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=90)
    buf.seek(0)

    response = requests.post(url, params=params, files={"file": ("image.jpg", buf.getvalue(), "image/jpeg")}, timeout=60)
    response.raise_for_status()
    return response.json()


def is_detection_prediction(pred: Dict[str, Any]) -> bool:
    return all(k in pred for k in ("x", "y", "width", "height"))


def annotate_detections(image: Image.Image, predictions: List[Dict[str, Any]]) -> Image.Image:
    annotated = image.copy()
    draw = ImageDraw.Draw(annotated)
    try:
        font = ImageFont.load_default()
    except Exception:
        font = None

    # Deterministic color palette
    palette = [
        (255, 99, 132), (54, 162, 235), (255, 206, 86), (75, 192, 192),
        (153, 102, 255), (255, 159, 64), (46, 204, 113), (231, 76, 60),
    ]
    class_to_color: Dict[str, tuple] = {}

    W, H = annotated.size

    for pred in predictions:
        if not is_detection_prediction(pred):
            continue
        cls = pred.get("class") or pred.get("label") or "object"
        conf = pred.get("confidence")
        if cls not in class_to_color:
            class_to_color[cls] = palette[len(class_to_color) % len(palette)]
        color = class_to_color[cls]

        w, h = float(pred.get("width", 0)), float(pred.get("height", 0))
        x, y = float(pred.get("x", 0)), float(pred.get("y", 0))
        left = max(0, x - w / 2)
        top = max(0, y - h / 2)
        right = min(W - 1, x + w / 2)
        bottom = min(H - 1, y + h / 2)

        draw.rectangle([(left, top), (right, bottom)], outline=color, width=3)
        label = f"{cls} {conf:.2f}" if isinstance(conf, (int, float)) else str(cls)
        # Text background
        if font is not None:
            tw, th = draw.textbbox((0, 0), label, font=font)[2:]
        else:
            tw, th = 8 * len(label), 12
        text_bg = [(left, max(0, top - th - 2)), (left + tw + 6, top)]
        draw.rectangle(text_bg, fill=color)
        draw.text((left + 3, max(0, top - th - 1)), label, fill=(0, 0, 0), font=font)

    return annotated


col1, col2 = st.columns([1, 1])
with col1:
    if uploaded is not None:
        img = _to_pil_image(uploaded.read())
        st.image(img, caption="Input Image", use_container_width=True)
    else:
        img = None
        st.info("Upload an image to get started.")

with col2:
    if run:
        if not api_key:
            st.error("Missing Roboflow API key. Set via .env or the input field.")
        elif not model_id:
            st.error("Missing Model ID.")
        elif img is None:
            st.error("Please upload an image.")
        else:
            with st.spinner("Calling Roboflow inference..."):
                try:
                    url = build_inference_url(model_id, task_type)
                    if url is None:
                        st.error("Invalid model id.")
                    else:
                        # Common params; classification will ignore unrecognized params
                        params: Dict[str, Any] = {
                            "format": "json",
                            "confidence": 0.4,
                            "overlap": 0.45,
                        }
                        data = call_roboflow(url, api_key, img, params)

                        # Render results
                        if isinstance(data, dict) and "predictions" in data and isinstance(data["predictions"], list):
                            preds = data["predictions"]
                            # If detection, draw boxes; otherwise show top class table
                            if any(is_detection_prediction(p) for p in preds):
                                ann = annotate_detections(img, preds)
                                st.image(ann, caption="Detections", use_container_width=True)
                                # Also show a table view
                                table_rows = []
                                for p in preds:
                                    if is_detection_prediction(p):
                                        table_rows.append({
                                            "class": p.get("class") or p.get("label"),
                                            "confidence": p.get("confidence"),
                                            "x": p.get("x"),
                                            "y": p.get("y"),
                                            "width": p.get("width"),
                                            "height": p.get("height"),
                                        })
                                if table_rows:
                                    st.dataframe(pd.DataFrame(table_rows))
                            else:
                                # Classification style predictions
                                st.subheader("Classification Scores")
                                try:
                                    df = pd.DataFrame(preds)
                                except Exception:
                                    df = pd.DataFrame([{k: v for k, v in d.items() if isinstance(v, (int, float, str))} for d in preds])
                                st.dataframe(df)
                        else:
                            st.json(data)
                        st.success("Inference complete")
                except requests.HTTPError as e:
                    st.error(f"HTTP error: {e}")
                    if e.response is not None:
                        try:
                            st.code(e.response.text)
                        except Exception:
                            pass
                except Exception as e:
                    st.error(f"Unexpected error: {e}")

st.markdown(
    """
    Tip:
    - Set `ROBOFLOW_API_KEY` in a `.env` file at project root:
      
      ROBOFLOW_API_KEY=rf_xxx
      
    - For `Model ID`, open your Roboflow Project → Deploy → Hosted API and copy the path like `your-workspace/your-project/1`.
    """
)

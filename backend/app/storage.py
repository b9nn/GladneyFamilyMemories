import os
import io
import uuid
import mimetypes
from pathlib import Path
from typing import Optional, Tuple
import boto3
from botocore.exceptions import ClientError

USE_CLOUD_STORAGE = os.getenv("USE_CLOUD_STORAGE", "").lower() == "true"
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL", "")
S3_ACCESS_KEY_ID = os.getenv("S3_ACCESS_KEY_ID", "")
S3_SECRET_ACCESS_KEY = os.getenv("S3_SECRET_ACCESS_KEY", "")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "gladneyfamilymemories")
LOCAL_UPLOAD_DIR = Path("uploads")
PRESIGNED_URL_EXPIRY = 3600  # 1 hour


def _s3():
    return boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT_URL,
        aws_access_key_id=S3_ACCESS_KEY_ID,
        aws_secret_access_key=S3_SECRET_ACCESS_KEY,
        region_name="auto",
    )


def _local_dir(category: str) -> Path:
    path = LOCAL_UPLOAD_DIR / category
    path.mkdir(parents=True, exist_ok=True)
    return path


def _convert_heic(file_bytes: bytes) -> bytes:
    try:
        from pillow_heif import register_heif_opener
        register_heif_opener()
        from PIL import Image
        img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        out = io.BytesIO()
        img.save(out, format="JPEG", quality=90)
        return out.getvalue()
    except Exception as e:
        print(f"[STORAGE] HEIC conversion failed: {e}")
        return file_bytes


def upload_file(
    file_bytes: bytes,
    original_filename: str,
    category: str,
    content_type: Optional[str] = None,
    convert_heic: bool = False,
) -> Tuple[str, str]:
    """Upload a file. Returns (storage_key, url)."""
    filename = original_filename
    if convert_heic and original_filename.lower().endswith((".heic", ".heif")):
        file_bytes = _convert_heic(file_bytes)
        filename = Path(original_filename).stem + ".jpg"
        content_type = "image/jpeg"

    ext = Path(filename).suffix
    key = f"{category}/{uuid.uuid4().hex}{ext}"

    if not content_type:
        content_type, _ = mimetypes.guess_type(filename)
        content_type = content_type or "application/octet-stream"

    if USE_CLOUD_STORAGE:
        _s3().put_object(Bucket=S3_BUCKET_NAME, Key=key, Body=file_bytes, ContentType=content_type)
        url = _s3().generate_presigned_url("get_object", Params={"Bucket": S3_BUCKET_NAME, "Key": key}, ExpiresIn=PRESIGNED_URL_EXPIRY)
    else:
        (_local_dir(category) / Path(key).name).write_bytes(file_bytes)
        url = f"/uploads/{key}"

    return key, url


def get_file_url(file_path: str) -> str:
    if USE_CLOUD_STORAGE:
        try:
            return _s3().generate_presigned_url("get_object", Params={"Bucket": S3_BUCKET_NAME, "Key": file_path}, ExpiresIn=PRESIGNED_URL_EXPIRY)
        except ClientError as e:
            print(f"[STORAGE] Presigned URL error for {file_path}: {e}")
            return ""
    return f"/uploads/{file_path}"


def delete_file(file_path: str) -> bool:
    if USE_CLOUD_STORAGE:
        try:
            _s3().delete_object(Bucket=S3_BUCKET_NAME, Key=file_path)
            return True
        except ClientError:
            return False
    local = LOCAL_UPLOAD_DIR / file_path
    if local.exists():
        local.unlink()
    return True

import traceback
from backend.services.pipeline_service import pipeline_service

try:
    pipeline_service.load_data()
    pipeline_service.get_detailed_pipeline_response()
    print("Success")
except Exception as e:
    traceback.print_exc()

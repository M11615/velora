FROM python:3.14-slim

WORKDIR /opt/velora

RUN mkdir .wheels
COPY ./apps/ai/.wheels ./.wheels

RUN python -m pip install ./.wheels/*.whl

RUN mkdir src
COPY ./apps/ai/src ./src

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]

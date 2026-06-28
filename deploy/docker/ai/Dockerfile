FROM python:3.14-slim

WORKDIR /opt/velora

RUN mkdir .wheels
COPY ./.wheels ./.wheels

RUN pip install ./.wheels/*.whl

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

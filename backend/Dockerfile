# syntax=docker/dockerfile:1

FROM python:3.11-slim-bookworm

WORKDIR /python-docker
RUN apt-get update \
    && apt-get -y install libpq-dev gcc
    # && pip install psycopg2
    

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt --no-cache

COPY . .
EXPOSE 3000
CMD [ "python", "./routes.py"]
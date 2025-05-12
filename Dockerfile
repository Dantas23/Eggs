FROM FROM ghcr.io/drylian/mta:server

RUN apt update && apt install -y curl lib32z1 lib32gcc-s1 libglib2.0-0 libstdc++6 ca-certificates

COPY . /home/container

WORKDIR /home/container

CMD ["./mta-server64"]

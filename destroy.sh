#!/bin/bash

docker build . -t terraformer-image
exec docker run -it --env-file=.env terraformer-image destroy orange-apple-2345

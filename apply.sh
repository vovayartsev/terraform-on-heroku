#!/bin/bash

docker build . -t terraformer-image
exec docker run -it --env-file=.env terraformer-image apply orange-apple-2345

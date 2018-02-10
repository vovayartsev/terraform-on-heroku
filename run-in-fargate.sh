#!/bin/bash

exec fargate task run demo --task-role TerraformerFargateRole -e COMMAND=apply -e SANDBOX=orange-apple-2345

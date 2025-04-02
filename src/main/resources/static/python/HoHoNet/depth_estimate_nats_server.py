# depth estimate nats server
# Wed,Apr2,2025

import nats
import json
import asyncio
import subprocess

async def message_handler(msg):
    subject = msg.subject
    data = msg.data.decode()

    print(f"Received task on [{subject}]: {data}")
    task = json.loads(data)

    # 运行深度估计算法
    image_path = f"/data/{task['userId']}/{task['projectId']}/{task['imageName']}"
    command = f"python infer_depth.py --inp {image_path}"
    subprocess.run(command, shell=True)

    # build result
    result = {
        "picId": task["picId"],
        "status": "done",
        "depth_map": f"/output/{task['picId']}_depth.png"
    }

    nc = await nats.connect("nats://localhost:4222")
    await nc.publish("depth_result", json.dumps(result).encode())

async def main():
    nc = await nats.connect("nats://localhost:4222")
    await nc.subscribe("depth_estimate", cb=message_handler)
    print("Depth Estimate Server Listening for tasks...")
    await asyncio.Future()

asyncio.run(main())
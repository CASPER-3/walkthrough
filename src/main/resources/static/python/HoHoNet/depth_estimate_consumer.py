#depth estimation server rocketmq consumer.
# Wed,Apr2,2025
from rocketmq.client import  PushConsumer,Producer,Message
import subprocess
import json

# 监听服务
consumer = PushConsumer('depthEstimateConsumerGroup')
consumer.set_name_server_address('localhost:9876')
consumer.subscribe('DepthEstimateTopic')

# 计算服务
producer = Producer('depthEstimateProducerGroup')
producer.set_name_server_address('localhost:9876')
producer.start()

def handle_message(msg):
    task = json.loads(msg.body.decode('utf-8'))
    image_dir = task['image_dir']
    image_name = task['imageName']

    print(f"收到任务: {image_dir}/{image_name}")
    command = f"python infer_depth.py --inp {image_dir}/{image_name} --out {image_dir}"
    result = subprocess.run(command, shell=True, capture_output=True)

    result_msg = {
        "imageDir": image_dir,
        "imageName": image_name,
        "status": "completed" if result.returncode == 0 else "failed"
    }

    result_message = Message('DepthEstimateResultTopic')
    result_message.set_body(json.dumps(result_msg))
    producer.send(result_message)

    return 0

consumer.register_message_listener(handle_message)
consumer.start()
print("Depth Estimate计算服务已启动...")



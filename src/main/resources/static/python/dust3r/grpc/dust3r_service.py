from concurrent import futures
import grpc
import dust3rService_pb2
import dust3rService_pb2_grpc
import sys
sys.path.append("../")

from dust3r.inference import inference, load_model
from dust3r.utils.image import load_images
from dust3r.image_pairs import make_pairs
from dust3r.cloud_opt import global_aligner, GlobalAlignerMode
from dust3r.utils.device import to_numpy
import numpy as np


class Dust3rService(dust3rService_pb2_grpc.Dust3rServiceServicer):
    def Compute(self, request, context):
        input_data = request.message
        print(input_data)
        exec_dust3r(input_data,'B',10)
        result = "run dust3r successfully"
        return dust3rService_pb2.ComputeResponse(result=result)


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    dust3rService_pb2_grpc.add_Dust3rServiceServicer_to_server(Dust3rService(), server)
    server.add_insecure_port('[::]:50055')
    server.start()
    server.wait_for_termination()

def export_pose(root_dir, poses, scale_factor, face_index):
    pre_poses = {}
    last_separator_index = root_dir.rfind('/')
    current_dir = root_dir[:last_separator_index]
    last_separator_index = current_dir.rfind('/')
    parent_dir = current_dir[:last_separator_index]

    file_name = parent_dir + '/extrinsics_' + face_index + '.txt'
    # trans cam to world to world to cam
    # TODO if the face is not front or back,the export extrinsics need dot a rotation matrix
    pose_matrix_list = to_numpy(poses).tolist()

    world_to_camera_matrix_list = []

    for pose in pose_matrix_list:
        world_to_cam_pose = np.linalg.inv(pose)
        world_to_camera_matrix_list.append(world_to_cam_pose.tolist())

    for original_matrix in pose_matrix_list:
        for i in range(3):
            original_matrix[i][3] *= scale_factor

    for world_to_cam_matrix in world_to_camera_matrix_list:
        for i in range(3):
            world_to_cam_matrix[i][3] *= scale_factor

    formatted_matrix_list = []

    for matrix in pose_matrix_list:
        formatted_matrix = [[f'{num:.9f}' for num in row] for row in matrix]
        formatted_matrix_list.append(formatted_matrix)

    # for world_to_cam_matrix in world_to_camera_matrix_list:
    #     formatted_matrix = [[f'{num:.9f}' for num in row] for row in world_to_cam_matrix]
    #     formatted_matrix_list.append(formatted_matrix)

    with open(file_name, 'w') as file:
        file.write(f'{len(formatted_matrix_list)}\n')
        for matrix in formatted_matrix_list:
            for row in matrix:
                file.write(' '.join(row) + '\n')

def exec_dust3r(root_dir,face_index,scale):
    model_path = '../checkpoints/DUSt3R_ViTLarge_BaseDecoder_512_dpt.pth'
    device = 'cuda'
    batch_size = 1
    schedule = 'linear'
    lr = 0.01
    niter = 300

    configFilePath = root_dir + 'config.txt'
    img_paths = []
    try:
        with open(configFilePath, 'r') as file:
            for line in file:
                print(line, end='')
                line = line.rstrip('\n')
                img_paths.append(root_dir + line + '_' + face_index + '.jpg')  # end='' 用于避免额外空行
    except FileNotFoundError:
        print(f"文件 '{configFilePath}' 不存在")

    # for img_path in args.input:
    #     img_paths.append(args.root_dir + img_path)

    print(img_paths)
    for img_path in img_paths:
        print(img_path)

    model = load_model(model_path, device)
    images = load_images(img_paths, size=512)
    pairs = make_pairs(images, scene_graph='complete', prefilter=None, symmetrize=True)
    output = inference(pairs, model, device, batch_size=batch_size)

    # raw dust3r predictions
    view1, pred1 = output['view1'], output['pred1']
    view2, pred2 = output['view2'], output['pred2']

    scene = global_aligner(output, device=device, mode=GlobalAlignerMode.PointCloudOptimizer)
    loss = scene.compute_global_alignment(init="mst", niter=niter, schedule=schedule, lr=lr)

    imgs = scene.imgs
    focals = scene.get_focals()
    # cam to world
    poses = scene.get_im_poses()
    pts3d = scene.get_pts3d()
    confidence_masks = scene.get_masks()

    print(poses)

    scale_parameter = 1.0
    if scale:
        scale_parameter = float(scale)
    export_pose(root_dir, poses, scale_parameter, face_index)


if __name__ == '__main__':
    serve()

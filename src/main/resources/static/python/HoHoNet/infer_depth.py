import os, sys, time, glob
import argparse
import importlib
from tqdm import tqdm
from imageio import imread, imwrite
import torch
import numpy as np
import cv2
import open3d as o3d

from lib.config import config, update_config


def get_uni_sphere_xyz(H, W):
    j, i = np.meshgrid(np.arange(H), np.arange(W), indexing='ij')
    u = (i + 0.5) / W * 2 * np.pi * -1
    v = ((j + 0.5) / H - 0.5) * np.pi
    z = -np.sin(v)
    c = np.cos(v)
    y = c * np.sin(u)
    x = c * np.cos(u)
    sphere_xyz = np.stack([x, y, z], -1)
    return sphere_xyz


def generate_point_cloud(rgb_img, depth_img,input_path,write_path):
    depth_img = depth_img[..., None].astype(np.float32) * 0.001
    rgb = rgb_img
    depth = depth_img
    H, W = rgb.shape[:2]
    xyz = depth * get_uni_sphere_xyz(H, W)
    xyzrgb = np.concatenate([xyz, rgb / 255.], 2)

    crop_ratio = 80 / 512
    crop_z_above = 1.2
    # Crop the image and flatten
    if crop_ratio > 0:
        assert crop_ratio < 1
        crop = int(H * crop_ratio)
        xyzrgb = xyzrgb[crop:-crop]
    xyzrgb = xyzrgb.reshape(-1, 6)

    # Crop in 3d
    xyzrgb = xyzrgb[xyzrgb[:, 2] <= crop_z_above]

    # Visualize
    pcd = o3d.geometry.PointCloud()

    #########################################################
    #                                                       #
    #Change the horizontal plane from the xy plane          #
    #to the xz plane                                        #
    #Tue,Dec26,2023                                         #
    #########################################################
    # pcd.points = o3d.utility.Vector3dVector(xyzrgb[:, :3])
    pcd.points = o3d.utility.Vector3dVector(xyzrgb[:, [1, 2, 0]])
    pcd.colors = o3d.utility.Vector3dVector(xyzrgb[:, 3:])

    # o3d.visualization.draw_geometries([
    #     pcd,
    #     o3d.geometry.TriangleMesh.create_coordinate_frame(size=0.3, origin=[0, 0, 0])
    # ])

    pos = input_path.rfind('/', 0)
    img_name = input_path[pos + 1:-4]
    save_name = img_name + ".ply"
    out_path = write_path + save_name
    write_text = True
    o3d.io.write_point_cloud(out_path, pcd, write_ascii=write_text)


if __name__ == '__main__':

    # Parse args & config
    parser = argparse.ArgumentParser(formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument('--cfg', required=True)
    parser.add_argument('--pth', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--inp', required=True)
    parser.add_argument('opts',
                        help='Modify config options using the command-line',
                        default=None, nargs=argparse.REMAINDER)
    args = parser.parse_args()
    update_config(config, args)
    device = 'cuda' if config.cuda else 'cpu'

    # Parse input paths
    rgb_lst = glob.glob(args.inp)
    if len(rgb_lst) == 0:
        print('No images found')
        import sys;

        sys.exit()

    # Init model
    model_file = importlib.import_module(config.model.file)
    model_class = getattr(model_file, config.model.modelclass)
    net = model_class(**config.model.kwargs)
    net.load_state_dict(torch.load(args.pth, map_location=device))
    net = net.eval().to(device)

    # Run inference
    with torch.no_grad():
        for path in tqdm(rgb_lst):
            rgb = imread(path)
            if rgb.shape[0] != 512 or rgb.shape[1] != 1024:
                rgb = cv2.resize(rgb, (1024, 512))
            x = torch.from_numpy(rgb).permute(2, 0, 1)[None].float() / 255.
            if x.shape[2:] != config.dataset.common_kwargs.hw:
                x = torch.nn.functional.interpolate(x, config.dataset.common_kwargs.hw, mode='area')
            x = x.to(device)
            pred_depth = net.infer(x)
            if not torch.is_tensor(pred_depth):
                pred_depth = pred_depth.pop('depth')

            fname = os.path.splitext(os.path.split(path)[1])[0]
            depth = pred_depth.mul(1000).squeeze().cpu().numpy().astype(np.uint16)
            imwrite(
                os.path.join(args.out, f'{fname}.depth.png'),
                depth
            )
            generate_point_cloud(rgb,depth,path,args.out)

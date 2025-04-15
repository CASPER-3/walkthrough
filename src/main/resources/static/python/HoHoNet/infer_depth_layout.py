import os, sys, time, glob
import argparse
import importlib
from tqdm import tqdm
from imageio import imread, imwrite
import torch
import numpy as np
import cv2

import json

import open3d as o3d
from PIL import Image
from scipy.signal import correlate2d
from scipy.ndimage import shift

from lib.misc.post_proc import np_coor2xy, np_coorx2u, np_coory2v
from eval_layout import layout_2_depth

from lib.config import config, update_config


if __name__ == '__main__':

    # Parse args & config
    parser = argparse.ArgumentParser(formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument('--cfg', default='config/mp3d_layout/HOHO_layout_aug_efficienthc_Transen1_resnet34.yaml')
    parser.add_argument('--pth', default='ckpt/mp3d_layout_HOHO_layout_aug_efficienthc_Transen1_resnet34/ep300.pth')
    parser.add_argument('--out', required=True)
    parser.add_argument('--inp', required=True)
    parser.add_argument("--no_vis", action="store_true")
    parser.add_argument(
        "--show_ceiling",
        action="store_true",
        help="Rendering ceiling (skip by default)",
    )
    parser.add_argument(
        "--ignore_floor", action="store_true", help="Skip rendering floor"
    )
    parser.add_argument(
        "--ignore_wall", action="store_true", help="Skip rendering wall"
    )
    parser.add_argument(
        "--ignore_wireframe", action="store_true", help="Skip rendering wireframe"
    )
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
        import sys; sys.exit()

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
            x = torch.from_numpy(rgb).permute(2,0,1)[None].float() / 255.

            x = x.to(device)
            cor_id = net.infer(x)['cor_id']


            fname = os.path.splitext(os.path.split(path)[1])[0]
            with open(os.path.join(args.out, f'{fname}.layout.txt'), 'w') as f:
                for u, v in cor_id:
                    f.write(f'{u:.1f} {v:.1f}\n')

    # Reading source (texture img, cor_id txt)
    equirect_texture = rgb
    H, W = equirect_texture.shape[:2]


    # Convert corners to layout
    depth, floor_mask, ceil_mask, wall_mask = layout_2_depth(cor_id, H, W, return_mask=True)
    coorx, coory = np.meshgrid(np.arange(W), np.arange(H))
    us = np_coorx2u(coorx, W)
    vs = np_coory2v(coory, H)
    zs = depth * np.sin(vs)
    cs = depth * np.cos(vs)
    xs = cs * np.sin(us)
    ys = -cs * np.cos(us)

    # Aggregate mask
    mask = np.ones_like(floor_mask)
    if args.ignore_floor:
        mask &= ~floor_mask
    if not args.show_ceiling:
        mask &= ~ceil_mask
    if args.ignore_wall:
        mask &= ~wall_mask

    # Prepare ply's points and faces
    # xyzrgb = np.concatenate([
    #     xs[...,None], ys[...,None], zs[...,None],
    #     equirect_texture], -1)
    #########################################################
    #                                                       #
    #Change the horizontal plane from the xy plane          #
    #to the xz plane                                        #
    #Tue,Dec26,2023                                         #
    #########################################################
    xyzrgb = np.concatenate([
        ys[...,None], zs[...,None], -xs[...,None],
        equirect_texture], -1)
    xyzrgb = np.concatenate([xyzrgb, xyzrgb[:,[0]]], 1)
    mask = np.concatenate([mask, mask[:,[0]]], 1)
    lo_tri_template = np.array([
        [0, 0, 0],
        [0, 1, 0],
        [0, 1, 1]])
    up_tri_template = np.array([
        [0, 0, 0],
        [0, 1, 1],
        [0, 0, 1]])
    ma_tri_template = np.array([
        [0, 0, 0],
        [0, 1, 1],
        [0, 1, 0]])
    lo_mask = (correlate2d(mask, lo_tri_template, mode='same') == 3)
    up_mask = (correlate2d(mask, up_tri_template, mode='same') == 3)
    ma_mask = (correlate2d(mask, ma_tri_template, mode='same') == 3) & (~lo_mask) & (~up_mask)
    ref_mask = (
            lo_mask | (correlate2d(lo_mask, np.flip(lo_tri_template, (0,1)), mode='same') > 0) | \
            up_mask | (correlate2d(up_mask, np.flip(up_tri_template, (0,1)), mode='same') > 0) | \
            ma_mask | (correlate2d(ma_mask, np.flip(ma_tri_template, (0,1)), mode='same') > 0)
    )
    points = xyzrgb[ref_mask]

    ref_id = np.full(ref_mask.shape, -1, np.int32)
    ref_id[ref_mask] = np.arange(ref_mask.sum())
    faces_lo_tri = np.stack([
        ref_id[lo_mask],
        ref_id[shift(lo_mask, [1, 0], cval=False, order=0)],
        ref_id[shift(lo_mask, [1, 1], cval=False, order=0)],
    ], 1)
    faces_up_tri = np.stack([
        ref_id[up_mask],
        ref_id[shift(up_mask, [1, 1], cval=False, order=0)],
        ref_id[shift(up_mask, [0, 1], cval=False, order=0)],
    ], 1)
    faces_ma_tri = np.stack([
        ref_id[ma_mask],
        ref_id[shift(ma_mask, [1, 0], cval=False, order=0)],
        ref_id[shift(ma_mask, [0, 1], cval=False, order=0)],
    ], 1)
    faces = np.concatenate([faces_lo_tri, faces_up_tri, faces_ma_tri])



    if not args.no_vis:
        mesh = o3d.geometry.TriangleMesh()
        mesh.vertices = o3d.utility.Vector3dVector(points[:, :3])
        mesh.vertex_colors = o3d.utility.Vector3dVector(points[:, 3:] / 255.)
        mesh.triangles = o3d.utility.Vector3iVector(faces)
        draw_geometries = [mesh]

        # Show wireframe
        if not args.ignore_wireframe:
            # Convert cor_id to 3d xyz
            N = len(cor_id) // 2
            floor_z = -1.6
            floor_xy = np_coor2xy(cor_id[1::2], floor_z, W, H, floorW=1, floorH=1)
            c = np.sqrt((floor_xy**2).sum(1))
            v = np_coory2v(cor_id[0::2, 1], H)
            ceil_z = (c * np.tan(v)).mean()

            # Prepare wireframe in open3d
            assert N == len(floor_xy)
            wf_points = [[x, y, floor_z] for x, y in floor_xy] + \
                        [[x, y, ceil_z] for x, y in floor_xy]
            wf_lines = [[i, (i+1)%N] for i in range(N)] + \
                       [[i+N, (i+1)%N+N] for i in range(N)] + \
                       [[i, i+N] for i in range(N)]
            wf_colors = [[1, 0, 0] for i in range(len(wf_lines))]
            wf_line_set = o3d.geometry.LineSet()
            wf_line_set.points = o3d.utility.Vector3dVector(wf_points)
            wf_line_set.lines = o3d.utility.Vector2iVector(wf_lines)
            wf_line_set.colors = o3d.utility.Vector3dVector(wf_colors)
            draw_geometries.append(wf_line_set)

        o3d.io.write_triangle_mesh(os.path.join(args.out, f'{fname}.obj'),mesh,write_triangle_uvs=True)
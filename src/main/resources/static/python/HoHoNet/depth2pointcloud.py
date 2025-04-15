from imageio import imread
import numpy as np

rgb_path = "assets/scene1_slim.jpg"
depth_path = 'assets/scene1_slim.depth.png'
rgb = imread(rgb_path)
depth = imread(depth_path)
print(rgb.shape[0])
print(rgb.shape)
print(depth.shape)
depth = depth[...,None].astype(np.float32) * 0.001
print(depth.shape)

H, W = rgb.shape[:2]
print(H)
print(W)
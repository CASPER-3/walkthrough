/**
 * @file smoothTransition\Util.js
 * @description This file stores some common utility classes and methods.
 * @author WangZx.
 * @date Wed,Jul5,2023.
**/

import * as THREE from '/js/build/three.module.js';


/**
 * @description 工具类，主要维护一些坐标转换的方法
 */
export class Util {


    /**
     * 
     * @param {*} x Horizontal coordinates in the pixel coordinate system.
     * @param {*} y Vertical coordinates in the pixel coordinate system.
     * @param {*} w Pixel width.
     * @param {*} h Pixel height.
     * 
     * pixel coordinate:
     * 
     * h/2  ————————————————————
     *     |                    |
     *     |                    |
     *     |                    |
     *     |                    |
     *     |                    |
     *-h/2  ————————————————————
     *    -w/2                   w/2
     *      
     */
    pixel2uv(x, y, w, h) {

        return new THREE.Vector3((x / w) + 0.5, (y / h) + 0.5);

    };

    /**
     * @description 对二维点[x,y]生成类似 "x-y"格式的字符串，用于将控制点的集合生成Map
     * @param {[Number,Number]} p 
     * @returns {String} "x-y"
     */
    point2string(p) {
        return p[0].toFixed(0) + "-" + p[1].toFixed(0);
    }

    /**
     * 二维图像像素坐标转uv坐标
     * @param {*} x 
     * @param {*} y 
     * @param {*} w 
     * @param {*} h 
     * @returns 
     */ 
    xy2uv(x, y, w, h) {

        const u = (x / w) + 0.5;
        const v = (y / h) + 0.5;
        return new THREE.Vector2(u, v);

    }


    /**
     * @description 二维图像坐标转换为经纬坐标              \
     *              longitude = (x * 360) / w + 180      \
     *              latitude = (y * 180) / h
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} w original equirectangular picture pixel width.
     * @param {Number} h original equirectangular picture pixel height.
     */
    xy2lonlat(x, y, w, h) {

        const lon = (x * 360) / w + 180;
        const lat = (y * 180) / h;
        return {
            lon: lon,
            lat: lat
        };

    }


    /**
     * @description 二维图像坐标转换为三维空间坐标(图片作为球的纹理贴到球面上，二维点因此也被映射为球上的三维点).
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} w original equirectangular picture pixel width.
     * @param {Number} h original equirectangular picture pixel height.
     * @param {Number} r radius.
     * @returns {THREE.Vector3}
     */
    xy2xyz(x, y, w, h, r) {

        let lonlat = this.xy2lonlat(x, y, w, h);
        return this.lonlat2xyz(lonlat.lon, lonlat.lat, r);
    }

    /**
     * @description 经纬坐标转三维空间坐标,借助球面坐标系.  \
     *              x = Radius * sinφ * cosθ             \
     *              y = Radius * conφ                    \
     *              z = Radius * sinφ * sinθ             \
     * @param {Number} lon longitude.
     * @param {Number} lat latitude.
     * @param {Number} r radius.
     * @returns {THREE.Vector3}
     */
    lonlat2xyz(lon, lat, r) {

        const phi = THREE.Math.degToRad(90 - lat);
        const theta = THREE.Math.degToRad(lon);
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi);
        const z = r * Math.sin(phi) * Math.sin(theta);
        return new THREE.Vector3(x, y, z);

    };

    /**
     * @description lerp-Linear interpolation线性插值函数.
     * @param {*} a 
     * @param {*} b 
     * @param {*} t 
     */
    lerp(a, b, t) {
        return (1 - t) * a + t * b;
    }

    /**
     * @description 对一对控制点生成参数为t的线性插值过渡点.
     * @param {{x1,y1,x2,y2}} pair 
     */
    lerpPoint(pair, t) {
        return { x: this.lerp(pair.x1, pair.x2, t), y: this.lerp(pair.y1, pair.y2, t) };
    }



};
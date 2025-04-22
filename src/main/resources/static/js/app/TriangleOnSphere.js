/**
 * @file smoothTransition\TriangleOnSphere.js
 * @description This file stores the classes and methods related to Spherical Triangle Mesh.
 * @author Wangzx.
 * @data Thu,Jul6,2023
 *  
 **/

import * as THREE from '/js/build/three.module.js';
import { Delaunay } from "https://cdn.skypack.dev/d3-delaunay@6";
import { Util } from "/js/app/coordinateUtil.js";
import { TriangleMesh } from "/js/app/Triangle.js";

/**
 * @description 单个控制对类.
 */
class ControlPair {

    x1; y1; u1; v1;
    x2; y2; u2; v2;
    pair;
    util = new Util();

    constructor(x1, y1, x2, y2) {

        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.pair = {
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2
        }

    };

    toStr() {
        //return this.x1.toFixed(0) + "-" + this.y1.toFixed(0);
        return this.util.point2string([this.x1, this.y1]);
    };
};

/**
 * @description 生成球面上的控制三角形patch.
 */
export class ControlPatches {

    height; width;
    radius;
    pairs = [];
    controlPairMap = new Map();
    keyPoints = [];
    delaunay;
    delaunayTriangles = [];
    group = new THREE.Group();
    util = new Util();
    basicMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true, side: THREE.DoubleSide, transparent: true });
    materialA;
    materialB;
    scene;
    jsonUrl;
    controlPatches = [];
    warpTextures = [];
    controlPatchGroup = new THREE.Group();
    warpTextureGroup = new THREE.Group();

    constructor(w, h, r, jsonUrl, sphereMaterialA, sphereMaterialB, scene) {

        this.height = h;
        this.width = w;
        this.radius = r;
        this.materialA = sphereMaterialA;
        this.materialB = sphereMaterialB;
        this.scene = scene;
        this.jsonUrl = jsonUrl;


    };

    generateControlPatchAndWarpTexture() {
        fetch(this.jsonUrl)
            .then((response) => response.json())
            .then((jsonData) => {
                for (let pair of jsonData) {
                    let p = new ControlPair(pair.x1, pair.y1, pair.x2, pair.y2);
                    this.keyPoints.push([pair.x1, pair.y1]);
                    this.pairs.push(p);
                    this.generatePairMap(p);
                }
                this.genDelaunayTriangle();
                console.log(this.delaunay, "delaunay");
                console.log(this.delaunay.triangles, "tri");
                this.generatePatches();
            })
    };

    async loadFromJsonFile(jsonUrl) {
        const response = await fetch(jsonUrl);
        const jsonData = await response.json();
        for (let pair of jsonData) {
            let p = new ControlPair(pair.x1, pair.y1, pair.x2, pair.y2);
            this.keyPoints.push([pair.x1, pair.y1]);
            this.pairs.push(p);
            this.generatePairMap(p);
        }
    }

    /**
     * @description 生成两幅全景图同名控制点的Map，键是图A上的控制点的字符串化'x1-y1'，值是pair{x1,y1,x2,y2}.
     * @param {ControlPair} controlPair 
     */
    generatePairMap(controlPair) {

        this.controlPairMap.set(controlPair.toStr(), controlPair.pair);

    };

    getValue(key) {
        return this.controlPairMap.get(key);
    }

    async getPoints() {
        return this.keyPoints;
    }

    /**
     * @description 使用d3.js库的德劳内三角化方法，在控制点上进行三角剖分，并填充this.delaunayTriangles数组，
     *              数组的每个元素是一个三元组[[x1,y1],[x2,y2],[x3,y3]]，每个元素为三角形的一个顶点坐标.
     */
    genDelaunayTriangle() {
        console.log(this.keyPoints, "keypoints");
        this.delaunay = Delaunay.from(this.keyPoints);
        const triangleNum = this.delaunay.triangles.length / 3;
        for (let i = 0; i < triangleNum; ++i) {

            const t0 = this.delaunay.triangles[i * 3 + 0];
            const t1 = this.delaunay.triangles[i * 3 + 1];
            const t2 = this.delaunay.triangles[i * 3 + 2];
            const p0 = [this.delaunay.points[t0 * 2], this.delaunay.points[t0 * 2 + 1]];
            const p1 = [this.delaunay.points[t1 * 2], this.delaunay.points[t1 * 2 + 1]];
            const p2 = [this.delaunay.points[t2 * 2], this.delaunay.points[t2 * 2 + 1]];
            this.delaunayTriangles.push([p0, p1, p2]);
        }

    };

    /**
     * 
     * @param {TriangleMesh} triMesh 
     * @param {{x1,y1,x2,y2}} pair1
     * @param {{x1,y1,x2,y2}} pair2
     * @param {{x1,y1,x2,y2}} pair3
     * @param {Number}        t
     */
    calcLerpTriangle(triMesh, pair0, pair1, pair2, t) {

        const vertex0 = this.util.lerpPoint(pair0, t);
        const vertex1 = this.util.lerpPoint(pair1, t);
        const vertex2 = this.util.lerpPoint(pair2, t);

        const vertex0_3d = this.util.xy2xyz(vertex0.x, vertex0.y, this.width, this.height, this.radius);
        const vertex1_3d = this.util.xy2xyz(vertex1.x, vertex1.y, this.width, this.height, this.radius);
        const vertex2_3d = this.util.xy2xyz(vertex2.x, vertex2.y, this.width, this.height, this.radius);
        triMesh.updatePosition(vertex0_3d, vertex1_3d, vertex2_3d);
    };

    /**
     * 
     * @param {{x1,y1,x2,y2}} ref1 
     * @param {{x1,y1,x2,y2}} ref2 
     * @param {{x1,y1,x2,y2}} ref3 
     * @param {TriangleMesh} triMesh 
     */
    generateWarpTexture(ref1, ref2, ref3, triMesh, radius) {

        let uv1 = this.util.xy2uv(ref1.x1, ref1.y1, this.width, this.height);
        let uv2 = this.util.xy2uv(ref2.x1, ref2.y1, this.width, this.height);
        let uv3 = this.util.xy2uv(ref3.x1, ref3.y1, this.width, this.height);
        let uv1p = this.util.xy2uv(ref1.x2, ref1.y2, this.width, this.height);
        let uv2p = this.util.xy2uv(ref2.x2, ref2.y2, this.width, this.height);
        let uv3p = this.util.xy2uv(ref3.x2, ref3.y2, this.width, this.height);

        let materialAConfig = new SphericalTriangleConfig(
            uv1, uv2, uv3,
            this.materialA
        );

        let materialBConfig = new SphericalTriangleConfig(
            uv1p, uv2p, uv3p,
            this.materialB
        );

        let dualTriMesh = new DualTriangleOnSphere(
            triMesh.a.clone().setLength(radius),
            triMesh.b.clone().setLength(radius),
            triMesh.c.clone().setLength(radius),
            materialAConfig,
            materialBConfig,
            5,
            radius,
            false
        );

        // this.scene.add(dualTriMesh.edgeHelper1);
        // this.scene.add(dualTriMesh.edgeHelper2);


        this.warpTextures.push(dualTriMesh);
        this.warpTextureGroup.add(dualTriMesh.group);

    }

    /**
     * @description 对this.delaunayTriangles中的三角形，生成球面上的三角形网格和变形纹理.
     */
    generatePatches() {

        console.log(this.controlPairMap, "cpMap");
        for (let tri of this.delaunayTriangles) {
            let vertex0 = tri[0];
            let vertex1 = tri[1];
            let vertex2 = tri[2];
            const v0Name = this.util.point2string(vertex0);
            const v1Name = this.util.point2string(vertex1);
            const v2Name = this.util.point2string(vertex2);

            // 从Map中提取vertex在另一幅图像上的同名点.
            const ref0 = this.controlPairMap.get(v0Name);
            const ref1 = this.controlPairMap.get(v1Name);
            const ref2 = this.controlPairMap.get(v2Name);

            const vertex0_3d = this.util.xy2xyz(ref0.x1, ref0.y1, this.width, this.height, this.radius);
            const vertex1_3d = this.util.xy2xyz(ref1.x1, ref1.y1, this.width, this.height, this.radius);
            const vertex2_3d = this.util.xy2xyz(ref2.x1, ref2.y1, this.width, this.height, this.radius);

            // Control Patch.
            let triangle3d = new TriangleMesh(
                vertex0_3d,
                vertex1_3d,
                vertex2_3d,
                this.basicMaterial
            );

            this.controlPatches.push({
                triangle: triangle3d,
                pair0: ref0,
                pair1: ref1,
                pair2: ref2
            });

            this.controlPatchGroup.add(triangle3d.mesh);

            this.generateWarpTexture(ref0, ref1, ref2, triangle3d, this.radius);

        }
        this.group.add(this.controlPatchGroup);
        this.group.add(this.warpTextureGroup);
        this.controlPatchGroup.name = "controlPatchGroup";
        this.warpTextureGroup.name = "warpTextureGroup";
        this.group.name = "controlPatchAndWarpTexture";
        this.scene.add(this.group);
        
    };

    updatePosition(t) {

        let count = 0;
        for (let cp of this.controlPatches) {
            this.calcLerpTriangle(cp.triangle, cp.pair0, cp.pair1, cp.pair2, t);
            this.warpTextures[count].updatePosition(
                cp.triangle.a.clone().setLength(this.radius),
                cp.triangle.b.clone().setLength(this.radius),
                cp.triangle.c.clone().setLength(this.radius),
                false
            )
            ++count;
        }

    };

};

/**
 * @description 拟球面三角形的参数，主要是纹理相关的信息.
 */
export class SphericalTriangleConfig {

    uv1 = new THREE.Vector2();
    uv2 = new THREE.Vector2();
    uv3 = new THREE.Vector2();
    material;

    /**
     * 
     * @param {THREE.Vector2} uv1 
     * @param {THREE.Vector2} uv2 
     * @param {THREE.Vector2} uv3 
     * @param {THREE.Material} material 
     */
    constructor(uv1, uv2, uv3, material) {
        this.uv1.copy(uv1);
        this.uv2.copy(uv2);
        this.uv3.copy(uv3);
        this.material = material;

    };
};

/**
 * @description: 拟球面三角形.通过对一个平面三角形内部进行细分，模拟成球面上的三角形，n约大模拟效果越好，类似于微分学中通过不断细分的直线去拟合曲线，每一段直线段越短拟合效果越好。
 * 
 */
export class TriangleOnShere {

    nsep;
    radius;
    group = new THREE.Group();
    a = new THREE.Vector3();
    b = new THREE.Vector3();
    c = new THREE.Vector3();
    uv1 = new THREE.Vector2();
    uv2 = new THREE.Vector2();
    uv3 = new THREE.Vector2();
    useVertexNormals;
    vertices;
    indices = [];
    uvs;
    edgeHelper;

    /**
     * bary.png 中 (i,j) 的坐标，从上到下，从左到右的 index（0 开始）
     * @param {*} i 
     * @param {*} j 
     * @returns 
     */
    index(i, j) {

        return parseInt(i * (i + 1) / 2 + j);

    };

    /**
     * 计算重心坐标.
     * @param {*} i 
     * @param {*} j 
     */
    bary(i, j) {

        let n = this.nsep;
        return {
            x: (n - 1 - i) / (n - 1),
            y: (i - j) / (n - 1),
            z: j / (n - 1)
        };
    };

    traverse(callback = () => { }) {

        let n = this.nsep;
        for (let i = 0; i <= n - 1; ++i) {
            for (let j = 0; j <= i; ++j) {
                callback(i, j);
            }
        }
    };

    /**
     * 球面插值函数.
     * @param {*} v1 
     * @param {*} v2 
     * @param {*} t 
     */
    lerpDirection(v1, v2, t) {

        let angle = v1.angleTo(v2);
        let axis = new THREE.Vector3().crossVectors(v1, v2).normalize();
        return v1.clone().applyAxisAngle(axis, angle * t).normalize();

    };


    bary2cartesian(baryIndex) {
        let v = new THREE.Vector3();
        v.x = baryIndex.x * this.a.x + baryIndex.y * this.b.x + baryIndex.z * this.c.x;
        v.y = baryIndex.x * this.a.y + baryIndex.y * this.b.y + baryIndex.z * this.c.y;
        v.z = baryIndex.x * this.a.z + baryIndex.y * this.b.z + baryIndex.z * this.c.z;
        return v;
    };

    bary2uv(baryIndex) {

        let v = new THREE.Vector2();
        v.x = baryIndex.x * this.uv1.x + baryIndex.y * this.uv2.x + baryIndex.z * this.uv3.x;
        v.y = baryIndex.x * this.uv1.y + baryIndex.y * this.uv2.y + baryIndex.z * this.uv3.y;
        return v;
    };

    /**
     * 计算(i,j)的三维坐标.
     * @param {*} i 
     * @param {*} j 
     * @param {*} useAxisAngle 
     */
    position(i, j, useAxisAngle) {
        let v = new THREE.Vector3();
        if (useAxisAngle === true) {
            let vl = this.lerpDirection(this.a.clone().normalize(), this.b.clone().normalize(), i / (this.nsep - 1));
            let vr = this.lerpDirection(this.a.clone().normalize(), this.c.clone().normalize(), i / (this.nsep - 1));
            return this.lerpDirection(vl, vr, j / i);
        } else {
            // 实际使用的是这个，先从 (i,j) 获取重心坐标，再由重心坐标和三个顶点求得三维坐标.
            let baryIndex = this.bary(i, j);
            return this.bary2cartesian(baryIndex);
        };

    };

    /**
     * 计算(i,j)的uv坐标.
     * @param {*} i 
     * @param {*} j 
     * @returns 
     */
    uv(i, j) {
        let baryIndex = this.bary(i, j);
        return this.bary2uv(baryIndex);
    };

    updatePosition(a, b, c, useAxisAngle = false) {


        let verticesArray = [];
        this.a.copy(a.clone().normalize());
        this.b.copy(b.clone().normalize());
        this.c.copy(c.clone().normalize());


        this.traverse((i, j) => {

            let v = this.position(i, j, useAxisAngle);
            v = v.setLength(this.radius);
            verticesArray.push(v.x, v.y, v.z);
            if (this.useVertexNormals) {
                this.geometry.useVertexNormals.push(v.clone().negate().normalize());
            }

        });
        //console.log(verticesArray, "tos-up-vertices")
        this.vertices = new Float32Array(verticesArray);
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.vertices, 3));

    };

    setNsep(n) {

        this.nsep = n;

    };


    /**
     * 
     * @param {THREE.Vector3} a 三角形第一个顶点的坐标
     * @param {THREE.Vector3} b 三角形第二个顶点的坐标
     * @param {THREE.Vector3} c 三角形第三个顶点的坐标
     * @param {SphericalTriangleConfig} stConfig 球面三角形纹理相关的参数
     * @param {Number} n 三角细分参数
     * @param {Number} radius 球面半径
     * @param {Number} useAxisAngle 
     */
    constructor(a, b, c, stConfig, n, radius, useAxisAngle) {

        this.a.copy(a);
        this.b.copy(b);
        this.c.copy(c);
        this.uv1.copy(stConfig.uv1);
        this.uv2.copy(stConfig.uv2);
        this.uv3.copy(stConfig.uv3);
        this.material = stConfig.material;
        this.nsep = n;
        this.radius = radius;


        this.group.children = [];
        this.geometry = new THREE.BufferGeometry();

        if (this.useVertexNormals) {
            this.geometry.useVertexNormals = [];
        }

        let verticesArray = [];
        let uvsArray = [];

        //放入顶点和uv
        this.traverse((i, j) => {

            let v = this.position(i, j, useAxisAngle);
            v = v.setLength(this.radius);
            verticesArray.push(v.x, v.y, v.z);

            let uv = this.uv(i, j);
            uvsArray.push(uv.x, uv.y);
            if (this.useVertexNormals) {
                this.geometry.useVertexNormals.push(v.clone().negate().normalize());
            }
        });

        this.vertices = new Float32Array(verticesArray);

        this.geometry.verticesNeedUpdate = true;
        if (this.useVertexNormals) {
            this.geometry.normalsNeeedUpdate = true;
        }



        //放入索引
        for (let i = 1; i <= n - 1; ++i) {
            for (let j = 0; j < i; ++j) {
                //             A(i-1,j)
                //
                //               /\
                //              /__\
                //
                //         B(i,j)   C(i,j+1)
                let ix = this.index(i - 1, j);
                let iy = this.index(i, j);
                let iz = this.index(i, j + 1);
                this.indices.push(ix, iy, iz);
            }
        }

        for (let i = 1; i <= n - 2; ++i) {
            for (let j = 0; j < i; ++j) {
                //        B(i,j)   A(i,j+1)
                //              ____
                //              \  /
                //               \/
                //
                //           C(i+1,j+1)
                let ix = this.index(i, j + 1);
                let iy = this.index(i, j);
                let iz = this.index(i + 1, j + 1);
                this.indices.push(ix, iy, iz);
            }
        }
        this.uvs = new Float32Array(uvsArray);

        this.geometry.setIndex(this.indices);
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.vertices, 3));
        this.geometry.setAttribute('uv', new THREE.BufferAttribute(this.uvs, 2));
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.group.add(this.mesh);

        const edges = new THREE.EdgesGeometry(this.geometry);
        this.edgeHelper = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: 0xffffff
        }));

    }


};

/**
 * @description: 拟球面上的重叠的三角形对.用于产生过渡纹理效果.
 */
export class DualTriangleOnSphere {

    group = new THREE.Group();
    a = new THREE.Vector3();
    b = new THREE.Vector3();
    c = new THREE.Vector3();

    uv1 = new THREE.Vector2();
    uv2 = new THREE.Vector2();
    uv3 = new THREE.Vector2();
    nsep;
    radius;
    SphericalTriangleFront;
    SphericalTriangleBack;
    edgeHelper1;
    edgeHelper2;

    /**
     * @description: 调用SphericalTriangleFront和SphericalTriangleBack各自的update方法去更新它们的位置.
     * @param {*} a 
     * @param {*} b 
     * @param {*} c 
     */
    updatePosition(a, b, c, useAxisAngle) {

        console.log("dualTriUP")
        this.a.copy(a);
        this.b.copy(b);
        this.c.copy(c);
        this.SphericalTriangleFront.updatePosition(a, b, c, useAxisAngle);
        this.SphericalTriangleBack.updatePosition(a, b, c, useAxisAngle);

    };

    /**
     * 
     * @param {THREE.Vector3} a 
     * @param {THREE.Vector3} b 
     * @param {THREE.Vector3} c 
     * @param {SphericalTriangleConfig} spTriConfig1 
     * @param {SphericalTriangleConfig} spTriConfig2 
     * @param {Number} n 
     * @param {Number} radius 
     * @param {Number} useAxisAngle 
     */
    constructor(a, b, c, spTriConfig1, spTriConfig2, n, radius, useAxisAngle = false) {

        this.a = a;
        this.b = b;
        this.c = c;
        this.nsep = n;
        this.radius = radius;
        this.SphericalTriangleFront = new TriangleOnShere(a, b, c, spTriConfig1, n, radius * 1.0, useAxisAngle);
        this.SphericalTriangleBack = new TriangleOnShere(a, b, c, spTriConfig2, n, radius * 1.2, useAxisAngle);
        this.group.add(this.SphericalTriangleFront.mesh);
        this.group.add(this.SphericalTriangleBack.mesh);
        this.edgeHelper1=this.SphericalTriangleFront.edgeHelper;
        this.edgeHelper2=this.SphericalTriangleBack.edgeHelper;
    };

};



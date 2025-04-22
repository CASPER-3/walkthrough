/**
 * @file smoothTransition\Triangle.js
 * @description This file stores the classes and methods related to triangle Mesh.
 * @author Wangzx.
 * @data Thu,Jul6,2023
 *  
 **/


import * as THREE from '/js/build/three.module.js';



/**
 * @deprecated
 * @description 已弃用，测试使用THREE.js已废弃的Geometry类和Face3类构造三角形Mesh的方法.
 * @param {*} x 
 * @param {*} y 
 * @param {*} z 
 * @param {*} material 
 * @param {*} uv1 
 * @param {*} uv2 
 * @param {*} uv3 
 * @returns 
 */
function constructTriangle(x, y, z, material, uv1, uv2, uv3) {

    let geometry = new Geometry();
    geometry.vertices.push(x.clone());
    geometry.vertices.push(y.clone());
    geometry.vertices.push(z.clone());

    geometry.updatePosition = (a, b, c) => {
        geometry.vertices[0].copy(a);
        geometry.vertices[1].copy(b);
        geometry.vertices[2].copy(c);
        geometry.verticesNeedUpdate = true;
    }

    geometry.faces.push(new Face3(0, 1, 2));
    geometry.faceVertexUvs[0] = [];
    geometry.faceVertexUvs[0].push([uv1, uv2, uv3]);

    let mesh = new THREE.Mesh(geometry, material);
    return mesh;


}

/**
 * @deprecated
 * @param {*} a 
 * @param {*} b 
 * @param {*} c 
 * @returns 
 */
function getTriangle(a, b, c) {

    let tri = new THREE.Triangle(a.clone(), b.clone(), c.clone());
    let geo = new THREE.BufferGeometry();

    // let vertices = [tri.a, tri.b, tri.c];
    let vertices = new Float32Array([
        0.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0
    ])

    geo.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    let material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    let mesh = new THREE.Mesh(geo, material);
    return mesh;
}

/**
 * @description 基础的构建三角形Mesh的类.
 */
export class TriangleMesh {
    a; b; c;
    uv1; uv2; uv3;
    geometry;
    material;
    vertices;
    indices;
    mesh;
    uvs;
    triangle;

    constructor(a, b, c, material, uv1 = new THREE.Vector2(0, 0), uv2 = new THREE.Vector2(0, 0), uv3 = new THREE.Vector2(0, 0)) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.material = material;
        this.uv1 = uv1;
        this.uv2 = uv2;
        this.uv3 = uv3;

        this.triangle = new THREE.Triangle(a, b, c);

        this.geometry = new THREE.BufferGeometry();
        this.vertices = new Float32Array([
            a.x, a.y, a.z,
            b.x, b.y, b.z,
            c.x, c.y, c.z,
        ]);

        this.indices = [
            0, 1, 2,
        ];
        this.uvs = new Float32Array([
            uv1.x, uv1.y,
            uv2.x, uv2.y,
            uv3.x, uv3.y
        ]);
        this.geometry.setIndex(this.indices);
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.vertices, 3));
        this.geometry.setAttribute('uv', new THREE.BufferAttribute(this.uvs, 2));
        this.mesh = new THREE.Mesh(this.geometry, this.material);

    }

    constructTriangleMesh(a, b, c, material, uv1, uv2, uv3) {

    }

    /**
     * 
     * @param {THREE.Vector3} a 
     * @param {THREE.Vector3} b 
     * @param {THREE.Vector3} c 
     */
    updatePosition(a, b, c) {

        this.a = a;
        this.b = b;
        this.c = c;
        this.triangle = new THREE.Triangle(a, b, c);
        this.vertices = new Float32Array([
            a.x, a.y, a.z,
            b.x, b.y, b.z,
            c.x, c.y, c.z,
        ]);
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.vertices, 3));
        //this.mesh = new THREE.Mesh(this.geometry, this.material);
    }

}

/**
 * @description 拥有线性插值函数的TriangleMesh.     \
 *              Lerp:Linear interpolation.          
 */
class LerpTriangle extends TriangleMesh {

    triangleMesh;

    constructor(a, b, c, material, uv1 = new THREE.Vector2(0, 0), uv2 = new THREE.Vector2(0, 0), uv3 = new THREE.Vector2(0, 0)) {
        super(a, b, c, material, uv1, uv2, uv3);
        this.triangle = super.mesh;
    }

}
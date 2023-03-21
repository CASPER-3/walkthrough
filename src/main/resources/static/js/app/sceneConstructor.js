/*
*
* This file contains methods for parsing and reconstructing scenes from configuration files in json format.
* Thu,Mar9,2023.
*/

import * as THREE from '../build/three.module.js';
import {DDSLoader} from "../lib/loaders/DDSLoader.js";
import {MTLLoader} from "../lib/loaders/MTLLoader.js";
import {OBJLoader} from "../lib/loaders/OBJLoader.js";

// Entry Method of reconstruct scene.
export function sceneConstructor(scene, jsonUrl) {

    let sceneConfig;
    // let scene = new THREE.Scene();
    fetch(jsonUrl)
        .then((response) => response.json())
        .then((json) => {
            sceneConfig = json;
            parseSceneConfig(scene, sceneConfig);
        });

}


// function loadJsonFile(url) {
//     let sceneConfig;
//     fetch(url)
//         .then((response) => response.json())
//         .then((json) => {
//             sceneConfig = json;
//         });
//
//     return sceneConfig;
//
// }

// parsing configuration file and recover scene.
function parseSceneConfig(scene, sceneConfig) {

    const texturesConfigArr = sceneConfig["textures"];
    const skyboxConfigArr = sceneConfig["scene"]["skybox"];
    const naviConfigArr = sceneConfig["scene"]["navi"];
    const modelConfigArr = sceneConfig["scene"]["model"];

    const texturesMap = generateTexturesMap(texturesConfigArr);

    generateEditHelper(scene);
    constructSkybox(scene, skyboxConfigArr, texturesMap);
    constructNaviCircle(scene, naviConfigArr, texturesMap);
    constructModel(scene, modelConfigArr, texturesMap);

}

function generateTexturesMap(texturesConfigArr) {

    let texturesMap = new Map;
    for (const textureConfig of texturesConfigArr) {
        if (textureConfig.type === "skybox") {
            texturesMap.set(textureConfig.name, getTexturesFromAtlasFile(textureConfig.url, 6));
        } else if (textureConfig.type === "navi") {
            texturesMap.set(textureConfig.name, new THREE.TextureLoader().load(textureConfig.url));
        }

    }

    return texturesMap;

}

function constructSkybox(scene, skyboxConfigArr, texturesMap) {

    console.log(skyboxConfigArr);
    const panoGroup = new THREE.Group();
    panoGroup.name = "panoGroup";
    for (const skyboxConfig of skyboxConfigArr) {

        const materials = [];
        const textures_1 = texturesMap.get(skyboxConfig['texture'][0]);
        const textures_2 = texturesMap.get(skyboxConfig['texture'][1]);
        for (let i = 0; i < 6; i++) {
            materials.push(new THREE.ShaderMaterial({
                uniforms: {
                    texture1: {
                        value: textures_1[i]
                    },
                    //用于渐变的纹理
                    texture2: {
                        value: textures_2[i]
                    },
                    Uprogress: {
                        value: 0
                    },
                    alpha: {
                        value: 1
                    }
                },
                // 顶点着色器
                vertexShader: document.getElementById('vertexShader').textContent,
                // 片元着色器
                fragmentShader: document.getElementById('fragmentShader').textContent,
                transparent: true,
                depthTest: false
            }))
        }

        const skyBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials);

        skyBox.geometry.scale(skyboxConfig['geometryScale'].x, skyboxConfig['geometryScale'].y, skyboxConfig['geometryScale'].z);
        skyBox.scale.set(skyboxConfig["scale"].x, skyboxConfig["scale"].y, skyboxConfig["scale"].z);

        skyBox.rotation.x = skyboxConfig["rotation"].x;
        skyBox.rotation.y = skyboxConfig["rotation"].y;
        skyBox.rotation.z = skyboxConfig["rotation"].z;

        skyBox.position.copy(new THREE.Vector3(skyboxConfig["position"].x, skyboxConfig["position"].y, skyboxConfig["position"].z));
        skyBox.name = skyboxConfig["name"];

        panoGroup.add(skyBox);

    }
    scene.add(panoGroup);

}

function constructNaviCircle(scene, naviConfigArr, texturesMap) {

    console.log(naviConfigArr);
    const naviGroup = new THREE.Group();
    naviGroup.name = "naviGroup";

    for (const naviConfig of naviConfigArr) {
        const geometry_circle = new THREE.CircleBufferGeometry(0.3, 20, 0, 2 * Math.PI);
        geometry_circle.scale(naviConfig["geometryScale"].x, naviConfig["geometryScale"].y, naviConfig["geometryScale"].z);
        const texture_circle = texturesMap.get(naviConfig["texture"]);
        const mesh_circle = new THREE.Mesh(geometry_circle, new THREE.MeshBasicMaterial({
            map: texture_circle,
            transparent: true,
            depthTest: false
        }));

        mesh_circle.rotation.x = naviConfig["rotation"].x;
        mesh_circle.rotation.y = naviConfig["rotation"].y;
        mesh_circle.rotation.z = naviConfig["rotation"].z;

        const naviPosition = new THREE.Vector3(naviConfig["position"].x, naviConfig["position"].y, naviConfig["position"].z);
        mesh_circle.position.copy(naviPosition);

        mesh_circle.name = naviConfig["name"];
        mesh_circle.renderOrder = 11;

        scene.add(mesh_circle);
    }

}

function constructModel(scene, modelConfigArr) {
    const manager = new THREE.LoadingManager();
    manager.addHandler(/\.dds$/i, new DDSLoader());
    for (const modelConfig of modelConfigArr) {

        loadModel(scene, manager, modelConfig);

    }
}

function generateNaviMap(scene, naviConfigArr) {

    let naviMap = new Map;
    let skyboxMap = getSkyboxMapFromScene(scene);
    for(const naviConfig of naviConfigArr){
        naviMap.set(naviConfig["name"],skyboxMap.get(naviConfig["map"]));
    }
    return naviMap;

}

function getSkyboxMapFromScene(scene) {
    let skyboxMap = new Map;
    for (const object3D of scene.children) {
        if (object3D.name === "panoGroup") {
            for (const skybox of object3D.children) {
                skyboxMap.set(skybox.name, skybox);
            }
        }

    }
    return skyboxMap;
}

function loadModel(scene, manager, modelConfig) {

    let model, obj;

    new MTLLoader(manager)
        .setPath(modelConfig["path"])
        .load(modelConfig["mtl"], function (materials) {

            materials.preload();

            new OBJLoader(manager)
                .setMaterials(materials)
                .setPath(modelConfig["path"])
                .load(modelConfig["obj"], function (object) {
                    model = object;
                    obj = model;
                    obj.name = modelConfig["name"];

                    obj.rotateX(modelConfig["rotation"].x);
                    obj.rotateY(modelConfig["rotation"].y);
                    obj.rotateZ(modelConfig["rotation"].z);

                    console.log(object.position);
                    scene.add(object);
                }, onProgress, onError);

        });

    const onProgress = (xhr) => {


    };

    const onError = () => {

    }

}

function generateEditHelper(scene) {
    const axes = new THREE.AxesHelper(500);
    scene.add(axes);
    scene.add(new THREE.GridHelper(20, 20));
}

function getTexturesFromAtlasFile(atlasImgUrl, tilesNum) {

    const textures = [];

    for (let i = 0; i < tilesNum; i++) {

        textures[i] = new THREE.Texture();

    }

    new THREE.ImageLoader()
        .load(atlasImgUrl, (image) => {

            let canvas, context;
            const tileWidth = image.height;

            for (let i = 0; i < textures.length; i++) {

                canvas = document.createElement('canvas');
                context = canvas.getContext('2d');
                canvas.height = tileWidth;
                canvas.width = tileWidth;
                context.drawImage(image, tileWidth * i, 0, tileWidth, tileWidth, 0, 0, tileWidth, tileWidth);
                textures[i].image = canvas;
                textures[i].needsUpdate = true;

            }

        });

    return textures;

}
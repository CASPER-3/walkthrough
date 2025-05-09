/*
*
* This file contains methods for parsing and reconstructing scenes from configuration files in json format.
* Thu,Mar9,2023.
*
*/

import * as THREE from '../build/three.module.js';
import {DDSLoader} from "../lib/loaders/DDSLoader.js";
import {MTLLoader} from "../lib/loaders/MTLLoader.js";
import {OBJLoader} from "../lib/loaders/OBJLoader.js";
import {PLYLoader} from "../lib/loaders/PLYLoader.js";


/**
 * Entry Method of Reconstruct Scene.
 * 游览、编辑页面读入项目配置文件恢复three.js场景的入口方法.
 * 重建后的场景天空盒会被加入 'name' 属性为 'panoGroup' 的THREE.Group,
 * 导航热点加入 'name' 属性为 'naviGroup' 的THREE.Group,
 * 空间模型加入 'name' 属性为 'mtlModel' 的THREE.Group,
 * 'entityGroup' 是上述三个分组的父结点,'entityGroup' 会与 'transformControl' 控制器绑定使 'transformControl' 可以对重建后场景中的所有实体对象生效.
 * @param scene         THREE.Scene 容纳配置文件中实体重建后的场景对象
 * @param entityGroup   THREE.Group
 * @param jsonUrl       项目配置文件的资源路径
 */
export function sceneConstructor(scene, entityGroup, jsonUrl) {

    let sceneConfig;
    // let scene = new THREE.Scene();
    fetch(jsonUrl, {cache: "reload"})
        .then((response) => response.json())
        .then((json) => {
            sceneConfig = json;
            console.log(sceneConfig, "sceneConfig")
            parseSceneConfig(scene, entityGroup, sceneConfig);
            setInitView(scene, sceneConfig);
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


/**
 * parsing configuration file and recover scene.
 * @param scene
 * @param entityGroup
 * @param sceneConfig
 */
function parseSceneConfig(scene, entityGroup, sceneConfig) {

    const texturesConfigArr = sceneConfig["textures"];
    const skyboxConfigArr = sceneConfig["scene"]["skybox"];
    const naviConfigArr = sceneConfig["scene"]["navi"];
    const modelConfigArr = sceneConfig["scene"]["model"];

    const texturesMap = generateTexturesMap(texturesConfigArr);

    //generateEditHelper(scene);
    constructSkybox(entityGroup, skyboxConfigArr, texturesMap);
    constructNaviCircle(entityGroup, naviConfigArr, texturesMap);
    constructModel(entityGroup, modelConfigArr, texturesMap);
    scene.add(entityGroup);

}

/**
 * 加载配置文件中的所有贴图项,并生成以 'id' 为key, 'THREE.Texture' 为value的Map.
 * @param texturesConfigArr
 * @returns {Map<string, THREE.Texture>}
 */
function generateTexturesMap(texturesConfigArr) {

    let texturesMap = new Map;
    for (const textureConfig of texturesConfigArr) {
        if (textureConfig.type === "skybox") {
            texturesMap.set(textureConfig.id, getTexturesFromAtlasFile(textureConfig.url, 6));
        } else if (textureConfig.type === "navi") {
            texturesMap.set(textureConfig.id, new THREE.TextureLoader().load(textureConfig.url));
        }

    }

    return texturesMap;

}

/**
 * @brief 加载配置文件中场景天空盒对象.
 * @param parentObject
 * @param skyboxConfigArr
 * @param texturesMap
 */
function constructSkybox(parentObject, skyboxConfigArr, texturesMap) {

    let initflag = false;
    console.log(skyboxConfigArr);
    const panoGroup = new THREE.Group();
    panoGroup.name = "panoGroup";
    for (const skyboxConfig of skyboxConfigArr) {

        const materials = [];
        const textures_1 = texturesMap.get(skyboxConfig['texture'][0]);
        //const textures_2 = texturesMap.get(skyboxConfig['texture'][1]);
        for (let i = 0; i < 6; i++) {
            materials.push(new THREE.ShaderMaterial({
                uniforms: {
                    texture1: {
                        value: textures_1[i]
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

        // for (let i = 0; i < 6; ++i) {
        //     materials.push(new THREE.MeshBasicMaterial({map: textures_1[i]}));
        // }

        const skyBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials);

        skyBox.geometry.scale(skyboxConfig['geometryScale'].x, skyboxConfig['geometryScale'].y, skyboxConfig['geometryScale'].z);
        skyBox.scale.set(skyboxConfig["scale"].x, skyboxConfig["scale"].y, skyboxConfig["scale"].z);

        skyBox.rotation.x = skyboxConfig["rotation"].x;
        skyBox.rotation.y = skyboxConfig["rotation"].y;
        skyBox.rotation.z = skyboxConfig["rotation"].z;

        // skyBox.rotateX(0.5*Math.PI)
        // skyBox.rotateZ(0.5*Math.PI)
        // skyBox.rotateZ(Math.PI)

        skyBox.position.copy(new THREE.Vector3(skyboxConfig["position"].x, skyboxConfig["position"].y, skyboxConfig["position"].z));
        skyBox.name = skyboxConfig["name"];
        skyBox.customId = skyboxConfig["id"];
        console.log(textures_1[0], "texture_1[0]");

        skyBox.tileWidth = textures_1[0].tileWidth;
        if (parentObject.isTourMode) {
            if (initflag) {
                skyBox.visible = false;
            }
            initflag = true;
        }
        panoGroup.add(skyBox);

    }
    parentObject.add(panoGroup);

}

function constructNaviCircle(parentObject, naviConfigArr, texturesMap) {

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
        mesh_circle.customId = naviConfig["id"];
        mesh_circle.map = naviConfig["map"];
        mesh_circle.renderOrder = 11;

        naviGroup.add(mesh_circle);
    }

    parentObject.add(naviGroup);

}

/**
 * @LastModify Wed,Nov22,2023, Add multi mesh format loader.
 * @param parentObject
 * @param modelConfigArr
 */
function constructModel(parentObject, modelConfigArr) {

    const manager = new THREE.LoadingManager();
    manager.addHandler(/\.dds$/i, new DDSLoader());
    for (const modelConfig of modelConfigArr) {

        if (modelConfig["type"] && modelConfig["type"] === 'ply') {
            console.log("load ply model")
            loadPLYModel(parentObject, modelConfig);
        }else if(modelConfig["type"] && modelConfig["type"] === 'mtl'){
            console.log("load mtl model");
            loadModel(parentObject,manager,modelConfig);
        }
        else {
            loadOBJModel(parentObject, manager, modelConfig);
        }


    }
}

// generate map for navi circles mapping to cube
function generateNaviMap(scene, naviConfigArr) {

    let naviMap = new Map;
    let skyboxMap = getSkyboxMapFromScene(scene);
    for (const naviConfig of naviConfigArr) {
        naviMap.set(naviConfig["name"], skyboxMap.get(naviConfig["map"]));
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

/**
 * 加载空间模型方法
 * @param parentObject
 * @param manager
 * @param modelConfig
 */
function loadModel(parentObject, manager, modelConfig) {

    let model, obj;

    new MTLLoader(manager)
        .setPath(modelConfig["url"])
        .load(modelConfig["id"] + '.mtl', function (materials) {

            materials.preload();

            new OBJLoader(manager)
                //.setMaterials(materials)
                .setPath(modelConfig["url"])
                .load(modelConfig["id"] + '.obj', function (object) {
                    model = object;
                    obj = model;
                    // obj.name = modelConfig["name"];
                    obj.name = "mtlModel";

                    obj.children[0].rotateX(modelConfig["rotation"].x);
                    obj.children[0].rotateY(modelConfig["rotation"].y);
                    obj.children[0].rotateZ(modelConfig["rotation"].z);

                    obj.children[0].position.copy(new THREE.Vector3(modelConfig["position"].x, modelConfig["position"].y, modelConfig["position"].z));
                    obj.children[0].scale.set(modelConfig["scale"].x, modelConfig["scale"].y, modelConfig["scale"].z);

                    console.log(object.position);
                    obj.children[0].name = modelConfig["name"];
                    obj.children[0].customId = modelConfig["id"];
                    object.visible = !parentObject.isTourMode;
                    parentObject.add(object);
                }, onProgress, onError);

        });

    const onProgress = (xhr) => {


    };

    const onError = () => {

    }

}

/**
 * Wed,Apr3,2024
 * @param parentObject
 * @param manager
 * @param modelConfig
 */
function loadOBJModel(parentObject, manager, modelConfig) {

    let model, obj;
    const loader = new OBJLoader(manager);

    loader.load(modelConfig["url"]+modelConfig["id"], (object) => {
            model = object;
            obj = model;
            if (obj instanceof THREE.Object3D)
            {
                obj.traverse (function (mesh)
                {
                    if (! (mesh instanceof THREE.Mesh)) return;

                    mesh.material.side = THREE.DoubleSide;
                });
            }
            // obj.name = modelConfig["name"];
            obj.name = "mtlModel";

            obj.children[0].rotateX(modelConfig["rotation"].x);
            obj.children[0].rotateY(modelConfig["rotation"].y);
            obj.children[0].rotateZ(modelConfig["rotation"].z);

            obj.children[0].position.copy(new THREE.Vector3(modelConfig["position"].x, modelConfig["position"].y, modelConfig["position"].z));
            obj.children[0].scale.set(modelConfig["scale"].x, modelConfig["scale"].y, modelConfig["scale"].z);

            console.log(object.position);
            obj.children[0].name = modelConfig["name"];
            obj.children[0].customId = modelConfig["id"];
            object.visible = !parentObject.isTourMode;
            parentObject.add(object);

        }, function (xhr) {

            //console.log((xhr.loaded / xhr.total * 100) + '% loaded');

        },
        // called when loading has errors
        function (error) {


            console.log('An error happened');
            console.log(error)

        })

}

/**
 * Wed,Nov22,2023
 * @param parentObject
 * @param modelConfig
 */
function loadPLYModel(parentObject, modelConfig) {

    const loader = new PLYLoader();
    const pcdPath = modelConfig['url'] + modelConfig['id'] + '.ply'
    loader.load(pcdPath, (geometry) => {
        const material = new THREE.PointsMaterial({size: 0.01, vertexColors: true})
        const object = new THREE.Points(geometry, material)
        object.customId = modelConfig["id"];
        object.name = modelConfig["name"];
        object.rotation.x = modelConfig["rotation"].x;
        object.rotation.y = modelConfig["rotation"].y;
        object.rotation.z = modelConfig["rotation"].z;

        object.position.copy(new THREE.Vector3(modelConfig["position"].x, modelConfig["position"].y, modelConfig["position"].z));
        parentObject.add(object)
    })

}

function generateEditHelper(scene) {
    const axes = new THREE.AxesHelper(500);
    scene.add(axes);
    scene.add(new THREE.GridHelper(20, 20));
}

export function getTexturesFromAtlasFile(atlasImgUrl, tilesNum) {

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
                textures[i].tileWidth = tileWidth;

            }

        });

    console.log(textures, "textures");
    return textures;

}

// 设置初始视角,如果项目配置文件 'metadata.initView' 未定义则设置初始视角设置为第一个天空盒的位置.
function setInitView(scene, sceneConfig) {

    console.log("setInitView");
    console.log(sceneConfig["metadata"].initView, "initView");

    const skyboxConfigArr = sceneConfig["scene"]["skybox"];
    let cameraPos = (sceneConfig["metadata"].initView === null || sceneConfig["metadata"].initView === undefined) ? skyboxConfigArr[0].position : sceneConfig["metadata"].initView;
    // let cameraPos = skyboxConfigArr[0].position;

    console.log(cameraPos, "cameraPos");

    for (const obj3d of scene.children) {
        if (obj3d.isPerspectiveCamera) {
            // obj3d.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
            obj3d.position.copy(cameraPos);
            obj3d.position.x += 0.01;
            return;
        }
    }

}
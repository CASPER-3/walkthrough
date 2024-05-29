/**
 * This file contains methods for parsing and load point clouds from configuration files in json format.
 * Wed,Oct25,2023
 */
import * as THREE from "../build/three.module.js"
import {PLYLoader} from "../lib/loaders/PLYLoader.js";
import SpriteText from "./SpriteText.js"

let pcd_idx = 0;

/**
 * Entry method for load point clouds from configuration file.
 * Wed,Oct25,2023
 * @param scene
 * @param entityGroup
 * @param jsonUrl
 */
export function pointCloudConstructor(scene, entityGroup, jsonUrl) {

    let sceneConfig;
    fetch(jsonUrl, {cache: "reload"})
        .then((response) => response.json())
        .then((json) => {
            sceneConfig = json;
            loadPointCloudFromConfiguration(scene,entityGroup,sceneConfig);
        })

}

/**
 * parse configuration file and load point cloud to THREE.js scene.
 * Wed,Oct25,2023
 * @param scene
 * @param entityGroup
 * @param pointCloudConfig
 */
function loadPointCloudFromConfiguration(scene, entityGroup, pointCloudConfig) {

    const pointCloudArray = pointCloudConfig['pointclouds'];
    console.log(pointCloudArray);
    constructPointCloud(entityGroup, pointCloudArray);
    scene.add(entityGroup)


}


/**
 * Load the point cloud according to the .ply file path in configuration
 * Wed,Oct25,2023
 * @param entityGroup
 * @param pointCloudConfigArr
 */
function constructPointCloud(entityGroup, pointCloudConfigArr) {

    const pointCloudGroup = new THREE.Group();
    pointCloudGroup.name = "pointCloudGroup";
    const loader = new PLYLoader();
    let count = 0;
    for (const pointCloudConfig of pointCloudConfigArr) {

        const pcdPath = pointCloudConfig['url']
        loader.load(pcdPath, (geometry) => {
            const material = new THREE.PointsMaterial({size: 0.001, vertexColors: true});
            //Increase brightness
            material.color.setRGB(2,2,2);
            console.log("load pyl geometry",geometry)
            const object = new THREE.Points(geometry, material)
            object.customId = pointCloudConfig["id"];
            object.name = pointCloudConfig["name"];
            if(pointCloudConfig["index"]!==null&&pointCloudConfig["index"]!==undefined){

                object.customIndex = pointCloudConfig["index"];

            }
            object.rotation.x = pointCloudConfig["rotation"].x;
            object.rotation.y = pointCloudConfig["rotation"].y;
            object.rotation.z = pointCloudConfig["rotation"].z;

            object.position.copy(new THREE.Vector3(pointCloudConfig["position"].x, pointCloudConfig["position"].y, pointCloudConfig["position"].z));
            // object.rotateX(-Math.PI/2)
            // object.rotateZ(-Math.PI/2)

            // let spriteLabel = makeTextSprite(count,
            //     { fontsize: 50, borderColor: { r: 0, g: 0, b: 0, a: 1 }, backgroundColor: { r: 71, g: 103, b: 254, a: 1 } });
            // spriteLabel.scale.set(1,1,1);

            // const lable = new SpriteText(count,2);
            // lable.backgroundColor = "#4747fe";
            // lable.borderWidth = 2;
            // lable.borderRadius = 2;
            // lable.padding = [6,2];
            // lable.fontSize = 90;
            // lable.borderColor = "black";
            const ContainerText = new SpriteText(count);
            ContainerText.color = 'white';
            ContainerText.backgroundColor = 'rgba(71, 103, 254,1)';
            ContainerText.borderColor = 'black';
            ContainerText.borderWidth = 1;
            ContainerText.borderRadius = 3;
            ContainerText.padding = [3, 1];
            ContainerText.scale.set(0.8,0.8,0.8);

            // let pointCloudWithLable = new THREE.Object3D();
            // pointCloudWithLable.add(object);
            // pointCloudWithLable.add(ContainerText);
            object.add(ContainerText)


            pointCloudGroup.add(object);
            ++count;
        })

    }
    entityGroup.add(pointCloudGroup);

    // mesh.position.y = -0.2;
    // mesh.position.z = 0.3;
    // mesh.rotation.x = -Math.PI / 2;
    // mesh.scale.multiplyScalar(2);
    //
    // mesh.castShadow = true;
    // mesh.receiveShadow = true;
    // console.log("point cloud",mesh)
    // object.scale.multiplyScalar(0.01)


}


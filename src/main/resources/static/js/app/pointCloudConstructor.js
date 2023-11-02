/**
 * This file contains methods for parsing and load point clouds from configuration files in json format.
 * Wed,Oct25,2023
 */
import * as THREE from "../build/three.module.js"
import {PLYLoader} from "../lib/loaders/PLYLoader.js";

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
    for (const pointCloudConfig of pointCloudConfigArr) {

        const pcdPath = pointCloudConfig['url']
        loader.load(pcdPath, (geometry) => {
            const material = new THREE.PointsMaterial({size: 0.01, vertexColors: true})
            const object = new THREE.Points(geometry, material)
            object.customId = pointCloudConfig["id"];
            object.name = pointCloudConfig["name"];
            object.rotation.x = pointCloudConfig["rotation"].x;
            object.rotation.y = pointCloudConfig["rotation"].y;
            object.rotation.z = pointCloudConfig["rotation"].z;

            object.position.copy(new THREE.Vector3(pointCloudConfig["position"].x, pointCloudConfig["position"].y, pointCloudConfig["position"].z));
            pointCloudGroup.add(object)
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
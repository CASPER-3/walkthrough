/*
*
* This file contains methods for exporting point clouds to configuration files in json format.
* Wed,Nov1,2023.
*
*/

import {getPointCloudArr, genObjectMap} from "/js/app/util.js"

const configurationFileId = sessionStorage.getItem("configurationFileId");
const userId = sessionStorage.getItem("userId");
const PREFIX = "/project/getEditSources/"


/**
 * 点云可视化编辑页面 '保存场景信息' 的入口方法，读取配置文件更新后写回.
 * @param scene
 * @param sceneConfigUrl
 */
export function updatePointCloudConfig(scene, sceneConfigUrl) {
    console.log("updatePointCloudConfig call")
    let sceneConfig;
    // let scene = new THREE.Scene();
    fetch(sceneConfigUrl)
        .then((response) => response.json())
        .then((json) => {
            sceneConfig = json;
            updatePointCloudInfo(scene, sceneConfig);
            updateMetaInfo(sceneConfig);
            axios.post("/" + "updateConfigFile" + "/" + userId + "/" + configurationFileId, sceneConfig).then(
                res => {
                    console.log(res);
                    console.log("configuration file update");
                }
            )

        });
}

/**
 * 全景漫游可视化编辑页面 '保存场景信息' 功能调用后更新配置文件的 'metadata.lastUpdate’ 属性,记录最后更新配置文件的时间.
 * @param sceneConfig
 */
function updateMetaInfo(sceneConfig) {
    const now = new Date();
    sceneConfig["metadata"].lastUpdate = now.toString();
}


/**
 * 根据场景中pointCloud对象的几何属性更新配置文件.
 * Wed,Nov1,2023
 * @param scene
 * @param sceneConfig
 */
function updatePointCloudInfo(scene, sceneConfig) {
    const pointCloudConfigArr = sceneConfig["pointclouds"];
    const pointCloudArr = getPointCloudArr(scene);
    const pointCloudMap = genObjectMap(pointCloudArr);
    for (let pointCloudConfig of pointCloudConfigArr) {
        const pointCloud = pointCloudMap.get(pointCloudConfig["id"]);

        pointCloudConfig["position"].x = pointCloud.position.x;
        pointCloudConfig["position"].y = pointCloud.position.y;
        pointCloudConfig["position"].z = pointCloud.position.z;

        pointCloudConfig["rotation"].x = pointCloud.rotation.x;
        pointCloudConfig["rotation"].y = pointCloud.rotation.y;
        pointCloudConfig["rotation"].z = pointCloud.rotation.z;

        pointCloudConfig["scale"].x = pointCloud.scale.x;
        pointCloudConfig["scale"].y = pointCloud.scale.y;
        pointCloudConfig["scale"].z = pointCloud.scale.z;

    }

}




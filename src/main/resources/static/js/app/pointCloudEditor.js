/**
 * @author WangZx
 * @version 1.0
 * @className pointCloudEditor.js
 * @date Fri,Oct20,2023
 * @createTime 14:55
 * @Description
 */

import * as THREE from "/js/build/three.module.js";

import {OrbitControls} from "/js/lib/controls/OrbitControls.js";
import {FirstPersonCameraControl} from "/js/lib/controls/firstPersonCameraControl.js";
import {TransformControls} from "/js/lib/controls/TransformControls.js"

import {GLTFLoader} from "/js/lib/loaders/GLTFLoader.js";

import {PLYLoader} from "/js/lib/loaders/PLYLoader.js";
import {PLYExporter} from "/js/lib/exporters/PLYExporter.js";

import {getAllPointClouds, rad2deg} from "/js/app/util.js"
import {pointCloudConstructor} from "/js/app/pointCloudConstructor.js"
import {updatePointCloudConfig} from "/js/app/pointCloudExporter.js";

import {genCubeMap} from '/js/app/generateTextures.js'
import {nanoid} from "/js/build/nanoid.js";

const configurationFileId = sessionStorage.getItem("configurationFileId");
const userId = sessionStorage.getItem("userId");
const projectConfigurationUrl = "/project/getEditSources/" + userId + "/" + configurationFileId + "/" + "projectConfig.json";
const extrinsicsUrl = "/project/getEditSources/" + userId + "/" + configurationFileId + "/" + "extrinsics_B.txt";

let container = document.getElementById("sceneContainer");

let camera, scene, scene2, renderer;

let orbitControls, firstPerson, transformControl;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let insetWidth;
let insetHeight;

let entityGroup;
let entityArr = null;
let boxhelperGroup = new THREE.Group();
let currentBoxhelper = null;

let currentSelected = null;
let currentSelectedIndex = null;
const enableSelection = true;
let lockedObjectSet = new Set();
let enableSelect = false;
let scaleSlider = null;

let showAddSkyboxModal;
let showAddNaviModal;

const genIdLength = 17;

init();
animate();

function init() {

    if (window !== window.parent) {
        console.log("iframe");
    }

    scene = new THREE.Scene();
    scene2 = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(10, 0, 0);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.autoClear = false;

    container.appendChild(renderer.domElement);

    scene.add(camera);

    entityGroup = new THREE.Group();
    entityGroup.name = "sceneEntity";
    entityGroup.isTourMode = false;

    pointCloudConstructor(scene, entityGroup, projectConfigurationUrl);
    console.log(scene, "scene");
    console.log(entityGroup, "entity")

    initControls();
    initLightAndHelper();

    //plyLoaderTest();

    // 这个事件绑定到 renderer.domElement 而不能绑定到全局的window上，否则在点击右侧菜单操作时也会误触发事件，导致场景中选中物体发生变化.
    renderer.domElement.addEventListener('pointerdown', onObjectSelection);
    window.addEventListener('resize', onWindowResize);

    const prevButton = document.getElementById("prevButton");
    const nextButton = document.getElementById("nextButton");

    prevButton.addEventListener('click', onPrevButtonClick);
    nextButton.addEventListener('click', onNextButtonClick);
}

function animate() {

    requestAnimationFrame(animate);
    if (orbitControls.enabled) orbitControls.update();
    // if(firstperson.enabled) firstperson.update();
    // if (materialLine !== null) {
    //     materialLine.resolution.set(insetWidth, insetHeight);
    // }

    // if (currentSelected !== null && currentBoxhelper !== null) {
    //     currentBoxhelper.setFromObject(currentSelected);
    // }

    renderer.clear();
    renderer.render(scene, camera);
    renderer.clearDepth();
    renderer.render(scene2, camera);

}

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    insetWidth = window.innerWidth / 4;
    insetHeight = window.innerHeight / 4;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function initControls() {

    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enabled = true;
    camera.position.set(0, 0, 2);

    transformControl = new TransformControls(camera, renderer.domElement);
    //transformControl.rotationSnap = 0.5 * Math.PI;
    transformControl.addEventListener('change', () => {
        if (currentSelected !== null) {
            currentBoxhelper.setFromObject(currentSelected);
            updateInfoPanel();
        }
        //renderer.render(scene, camera);
    });
    transformControl.addEventListener('dragging-changed', (event) => {
        orbitControls.enabled = !event.value;
    });

    scene.add(transformControl);

}

function initLightAndHelper() {

    const axes = new THREE.AxesHelper(500);
    scene.add(axes);
    const grid = new THREE.GridHelper(200, 200);
    grid.position.set(0, -1.5, 0);
    scene.add(grid);
    //scene.background = new THREE.Color(0xeeeeee);
    scene.background = new THREE.Color(0x000000);

    const ambientLight = new THREE.AmbientLight(0xcccccc, 1);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    camera.add(pointLight);

    // boxhelperGroup.name = "boxHelperContainer";
    // scene.add(boxhelperGroup);

}

/**
 * Test Feature:load .ply file and render point cloud.
 * Thu,Oct19,2023
 */
function plyLoaderTest() {

    const loader = new PLYLoader();
    const plyPath = "/src/main/resources/static/user_source/newTest/basketball_player_vox11_00000001.ply";
    loader.load("../../user_source/newTest/sixFloor2.0.jpg.ply", (geometry) => {

        const material = new THREE.PointsMaterial({size: 0.01, vertexColors: true});
        const object = new THREE.Points(geometry, material);


        // mesh.position.y = -0.2;
        // mesh.position.z = 0.3;
        // mesh.rotation.x = -Math.PI / 2;
        // mesh.scale.multiplyScalar(2);
        //
        // mesh.castShadow = true;
        // mesh.receiveShadow = true;
        // console.log("point cloud",mesh)
        // object.scale.multiplyScalar(0.01)
        scene.add(object);

    })


}

function onObjectSelection(event) {

    event.preventDefault();

    if (!enableSelect || transformControl.dragging)
        return;


    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(entityGroup, true);
    if (intersects.length < 1) return void 0;


    const selected = intersects[0].object;

    if (currentSelected !== selected) {
        currentSelected !== null ? currentSelected.remove(boxhelperGroup) : void 0;
        boxhelperGroup.clear();
        currentSelected = selected;
        const boxHelper = new THREE.BoxHelper(selected, 0xFF0000);

        boxhelperGroup.add(boxHelper);
        currentBoxhelper = boxHelper;
        //scene.add(boxHelper);
        scene.add(boxhelperGroup);
        if (!lockedObjectSet.has(selected)) {
            transformControl.attach(selected);
        }

        updateInfoPanel();
        scaleSlider.setValue(currentSelected.scale.x * 10);

    }

    renderer.render(scene, camera);

}

// 锁定选中物体，被锁定的物体在选中时不会显示transsformControl组件.
function lockObject() {

    if (currentSelected !== null && !lockedObjectSet.has(currentSelected)) {
        lockedObjectSet.add(currentSelected);
        transformControl.detach();
    }
}

// 解锁选中的物体
function unlockObject() {

    if (currentSelected === null)
        return;

    if (lockedObjectSet.has(currentSelected))
        lockedObjectSet.delete(currentSelected);
}

// 更改transformControl的控制模式，mode可以是”translate"、”Rotate"、“Scale".
function changeTransformControlMode(transformControl, mode) {
    transformControl.setMode(mode);
}

function updateInfoPanel() {

    const infoPanel = document.getElementById("objectInfo");
    const positionInfo = document.getElementById("objectPosition");
    const rotationInfo = document.getElementById("objectRotate");
    const scaleInfo = document.getElementById("objectScale");

    infoPanel.textContent = "当前选中:" + getCurrentSelectedObjectName();
    positionInfo.textContent = "位置:" + getCurrentSelectedObjectPosition();
    rotationInfo.textContent = "旋转:" + getCurrentSelectedObjectRotation();
    scaleInfo.textContent = "缩放:" + getCurrentSelectedObjectScale();
}

function getCurrentSelectedObjectName() {

    if (currentSelected.parent.name === "pointCloudGroup") {
        return "场景-" + currentSelected.name;
    }
}

function getCurrentSelectedObjectPosition() {
    let strX = (currentSelected.position.x).toString();
    let strY = (currentSelected.position.y).toString();
    let strZ = (currentSelected.position.z).toString();
    strX = strX.substring(0, strX.indexOf('.') + 3);
    strY = strY.substring(0, strY.indexOf('.') + 3);
    strZ = strZ.substring(0, strZ.indexOf('.') + 3);
    return "(" + strX + "," + strY + "," + strZ + ")";

}

function getCurrentSelectedObjectRotation() {
    let rotationX = rad2deg(currentSelected.rotation.x).toString();
    let rotationY = rad2deg(currentSelected.rotation.y).toString();
    let rotationZ = rad2deg(currentSelected.rotation.z).toString();
    rotationX = rotationX.substring(0, rotationX.indexOf('.') + 3) + "°";
    rotationY = rotationY.substring(0, rotationY.indexOf('.') + 3) + "°";
    rotationZ = rotationZ.substring(0, rotationZ.indexOf('.') + 3) + "°";

    return "(" + rotationX + "," + rotationY + "," + rotationZ + ")";
}

function getCurrentSelectedObjectScale() {

    let scaleX = currentSelected.scale.x.toString();
    let scaleY = currentSelected.scale.y.toString();
    let scaleZ = currentSelected.scale.z.toString();
    scaleX = scaleX.substring(0, scaleX.indexOf('.') + 3);
    scaleY = scaleY.substring(0, scaleY.indexOf('.') + 3);
    scaleZ = scaleZ.substring(0, scaleZ.indexOf('.') + 3);

    return "(" + scaleX + "," + scaleY + "," + scaleZ + ")";
}

function changeObjectScale(value) {

    if (currentSelected !== null) {
        currentSelected.scale.x = value / 10;
        currentSelected.scale.y = value / 10;
        currentSelected.scale.z = value / 10;
        updateInfoPanel();
    }

}

function changeObjectRotation(mode, value) {
    if (currentSelected !== null) {
        if (mode === 'X') {
            currentSelected.rotateX(THREE.MathUtils.degToRad(value));
        } else if (mode === 'Y') {
            currentSelected.rotateY(THREE.MathUtils.degToRad(value));
        } else if (mode === 'Z') {
            currentSelected.rotateZ(THREE.MathUtils.degToRad(value));
        }
    }
}

function onPrevButtonClick() {
    if (currentSelected === null)
        return;
    if (currentSelectedIndex === null) {

        initSelectedIndex();
        console.log(currentSelectedIndex);

    }
    selectPrevObject();
}

function onNextButtonClick() {
    if (currentSelected === null)
        return;
    if (currentSelectedIndex === null) {

        initSelectedIndex();
        console.log(currentSelectedIndex);
    }
    selectNextObject();
}

function initSelectedIndex() {

    if (currentSelected === null)
        return;

    for (let i = 0; i < entityArr.length; ++i) {

        if (entityArr[i] === currentSelected)
            currentSelectedIndex = i;
    }

}

function updateObjectByIndex(index) {

    currentSelected.remove(boxhelperGroup);
    boxhelperGroup.clear();
    currentSelected = entityArr[index];
    const boxHelper = new THREE.BoxHelper(currentSelected, 0xFF0000);

    boxhelperGroup.add(boxHelper);
    currentBoxhelper = boxHelper;
    //scene.add(boxHelper);
    scene.add(boxhelperGroup);
    if (!lockedObjectSet.has(currentSelected)) {
        transformControl.attach(currentSelected);
    }

    updateInfoPanel();
    scaleSlider.setValue(currentSelected.scale.x * 10);

}

function selectPrevObject() {

    if (currentSelectedIndex === 0)
        currentSelectedIndex = entityArr.length - 1;
    else
        currentSelectedIndex -= 1;

    updateObjectByIndex(currentSelectedIndex);
}

function selectNextObject() {

    if (currentSelectedIndex === entityArr.length - 1)
        currentSelectedIndex = 0;
    else
        currentSelectedIndex += 1;

    updateObjectByIndex(currentSelectedIndex);
}

function save(blob, filename) {

    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link); // Firefox workaround, see #6594
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    // URL.revokeObjectURL( url ); breaks Firefox...

}

// 将buffer保存为文件
function saveArrayBuffer(buffer, filename) {

    save(new Blob([buffer], {type: 'application/octet-stream'}), filename);

}

// 将调整点位对齐后的多个点云导出为.ply文件
function exportPointClouds() {

    // Instantiate an exporter
    const exporter = new PLYExporter();

    // Parse the input and generate the ply output
    const data = exporter.parse(entityGroup.children[0]);
    saveArrayBuffer(data, "fusion.ply")


}

/**
 *根据服务器对添加天空盒请求返回的响应信息在场景中添加新的场景天空盒.
 * @param scene                                     THREE.Scene
 * @param sceneInfo {sceneName,skyboxId,textureUrl} 服务器对添加天空盒请求的响应信息.
 */
function addSceneSkybox(scene, sceneInfo) {

    for (const obj3d of scene.children) {
        if (obj3d.name === "sceneEntity") {
            for (const entityGroup of obj3d.children) {
                if (entityGroup.name === "panoGroup") {

                    const materials = [];
                    const textures = getTexturesFromAtlasFile(sceneInfo.textureUrl, 6);
                    for (let i = 0; i < 6; ++i) {
                        materials.push(new THREE.MeshBasicMaterial({map: textures[i]}));
                    }
                    const skyBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials);

                    skyBox.geometry.scale(1, 1, -1);
                    skyBox.scale.set(1, 1, 1);

                    skyBox.rotation.x = 0;
                    skyBox.rotation.y = 0;
                    skyBox.rotation.z = 0;

                    skyBox.position.copy(new THREE.Vector3(0, 0, entityGroup.children.length));
                    skyBox.name = sceneInfo.sceneName;
                    skyBox.customId = sceneInfo.skyboxId;
                    entityGroup.add(skyBox);
                }
            }

        }
    }

}

/**
 * 添加场景功能的UI组件,实现添加场景功能,由表单弹出框与上传组件构成.
 * @returns {JSX.Element}
 * @constructor
 */
const AddSkyboxContent = () => {

    const [form] = antd.Form.useForm();
    const [isSceneInfoModalOpen, setIsSceneInfoModalOpen] = React.useState(false);
    const [sceneInfoData, setSceneInfoData] = React.useState(null);
    const [actionUrl, setActionUrl] = React.useState("");
    const uploadButtonRef = React.useRef(null);

    showAddSkyboxModal = () => {
        setIsSceneInfoModalOpen(true);
    };

    const handleSceneInfoModalOk = () => {

        form.validateFields().then((values) => {
            form.resetFields();
            setSceneInfoData({sceneName: values.sceneName})
            setIsSceneInfoModalOpen(false);
            uploadButtonRef.current.click();

        }).catch((info) => {
            console.log('validate Failed:', info);
        })

    };

    const handleSceneInfoModalCancel = () => {

        setIsSceneInfoModalOpen(false);
    };

    // <Antd.Upload>组件上传文件前的钩子方法,用于对原始文件进行验证或处理
    // (file, fileList) => boolean | Promise<File> | Upload.LIST_IGNORE
    // 将用户选择的 'Equirectangular' 投影全景图生成 'cubeMap' 贴图后上传.
    const handleBeforeUpload = (file) => {

        const picId = nanoid(genIdLength);
        const skyboxId = nanoid(genIdLength);
        setActionUrl("/addSkybox/" + userId + "/" + configurationFileId + "/" + picId + "/" + skyboxId);

        return new Promise((resolve, reject) => {

            genCubeMap(file, resolve);

        })

    }

    // 上传完成后的回调函数,调用在THREE.js场景中新建天空盒的方法.
    const handleAfterUpload = (result) => {

        if (result.file.status === "done") {
            addSceneSkybox(scene, result.file.response)
        }

    }

    return (
        <div>
            <antd.Upload id={"addSkyboxUpload"}
                         accept={"image/png, image/jpeg"}
                         action={actionUrl}
                         style={{display: 'none'}}
                         showUploadList={false}
                         data={sceneInfoData}
                         beforeUpload={handleBeforeUpload}
                         onChange={handleAfterUpload}>
                <antd.Button style={{display: "none"}} ref={uploadButtonRef}></antd.Button>
            </antd.Upload>
            <antd.Modal title="场景信息" open={isSceneInfoModalOpen} onOk={handleSceneInfoModalOk}
                        onCancel={handleSceneInfoModalCancel}>
                <antd.Form
                    form={form}
                    name="sceneInfo"
                    layout="vertical"
                    initialValues={{
                        remember: true,
                    }}
                    onFinish={() => {
                    }}
                    onFinishFailed={() => {
                    }}
                    autoComplete="off"
                >
                    <antd.Form.Item
                        label="场景名称"
                        name="sceneName"
                        rules={[
                            {
                                required: true,
                                message: 'Please input your sceneName!',
                            },
                        ]}
                    >
                        <antd.Input/>
                    </antd.Form.Item>
                    <antd.Form.Item
                        label="场景描述"
                        name="sceneDescription"
                        rules={[
                            {
                                required: false,
                            },
                        ]}
                    >
                        <antd.Input/>
                    </antd.Form.Item>
                </antd.Form>
            </antd.Modal>
        </div>
    );

}

/**
 * 根据服务器对添加热点请求返回的响应信息在场景中添加新的场景热点.
 * @param scene
 * @param naviInfo
 */
function addSceneNavi(scene, naviInfo) {

    for (const obj3d of scene.children) {
        if (obj3d.name === "sceneEntity") {
            for (const entityGroup of obj3d.children) {
                if (entityGroup.name === "naviGroup") {

                    const geometry_circle = new THREE.CircleBufferGeometry(0.3, 20, 0, 2 * Math.PI);
                    geometry_circle.scale(-1, 1, 1);
                    const texture_circle = new THREE.TextureLoader().load(naviInfo.textureUrl);
                    const mesh_circle = new THREE.Mesh(geometry_circle, new THREE.MeshBasicMaterial({
                        map: texture_circle,
                        transparent: true,
                        depthTest: false
                    }));

                    mesh_circle.rotation.x = 1.5707963267948966;
                    mesh_circle.rotation.y = 0;
                    mesh_circle.rotation.z = 0;

                    //const naviPosition = new THREE.Vector3(0, 0, entityGroup.children.length);
                    const naviPosition = new THREE.Vector3();
                    naviPosition.copy(currentSelected.position);
                    naviPosition.y = naviPosition.y - currentSelected.scale.y / 2;
                    mesh_circle.position.copy(naviPosition);

                    mesh_circle.name = naviInfo.naviName;
                    mesh_circle.customId = naviInfo.naviId;
                    mesh_circle.renderOrder = 11;
                    mesh_circle.map = naviInfo.map;
                    entityGroup.add(mesh_circle);
                }
            }

        }
    }

}

/**
 * 添加热点功能的UI组件,实现添加热点功能,由表单弹出框与上传组件构成.
 * @returns {JSX.Element}
 * @constructor
 */
const AddNaviContent = () => {

    const [form] = antd.Form.useForm();
    const [isNaviInfoModalOpen, setIsNaviInfoModalOpen] = React.useState(false);
    const [naviInfoData, setNaviInfoData] = React.useState(null);
    const [actionUrl, setActionUrl] = React.useState("");
    const uploadButtonRef = React.useRef(null);

    showAddNaviModal = () => {
        setIsNaviInfoModalOpen(true);
    };

    const handleNaviInfoModalOk = () => {

        form.validateFields().then((values) => {
            form.resetFields();
            setNaviInfoData({naviName: values.naviName})
            setIsNaviInfoModalOpen(false);
            uploadButtonRef.current.click();

        }).catch((info) => {
            console.log('validate Failed:', info);
        })

    };

    const handleNaviInfoModalCancel = () => {

        setIsNaviInfoModalOpen(false);
    };

    // <Antd.Upload>组件上传文件前的钩子方法,用于对原始文件进行验证或处理
    // (file, fileList) => boolean | Promise<File> | Upload.LIST_IGNORE
    const handleBeforeUpload = (file) => {

        const picId = nanoid(genIdLength);
        const naviId = nanoid(genIdLength);
        setActionUrl("/addNavi/" + userId + "/" + configurationFileId + "/" + picId + "/" + naviId + "/" + currentSelected.customId);

        return true;

    }

    // 上传完成后的回调函数,调用在THREE.js场景中新建天空盒的方法.
    const handleAfterUpload = (result) => {

        if (result.file.status === "done") {
            addSceneNavi(scene, result.file.response)
        }

    }

    return (
        <div>
            <antd.Upload id={"addNaviUpload"}
                         accept={"image/png, image/jpeg"}
                         action={actionUrl}
                         style={{display: 'none'}}
                         showUploadList={false}
                         data={naviInfoData}
                         beforeUpload={handleBeforeUpload}
                         onChange={handleAfterUpload}>
                <antd.Button style={{display: "none"}} ref={uploadButtonRef}></antd.Button>
            </antd.Upload>
            <antd.Modal title="热点信息" open={isNaviInfoModalOpen} onOk={handleNaviInfoModalOk}
                        onCancel={handleNaviInfoModalCancel}>
                <antd.Form
                    form={form}
                    name="naviInfo"
                    layout="vertical"
                    initialValues={{
                        remember: true,
                    }}
                    onFinish={() => {
                    }}
                    onFinishFailed={() => {
                    }}
                    autoComplete="off"
                >
                    <antd.Form.Item
                        label="热点名称"
                        name="naviName"
                        rules={[
                            {
                                required: true,
                                message: 'Please input your sceneName!',
                            },
                        ]}
                    >
                        <antd.Input/>
                    </antd.Form.Item>
                    <antd.Form.Item name="naviMapScene" label="热点绑定的场景" rules={[{required: true}]}>
                        <antd.Select
                            placeholder="选择一个热点绑定的场景"
                            onChange={() => {
                            }}
                            allowClear
                        >
                            <antd.Select.Option value="scene1">scene1</antd.Select.Option>
                            <antd.Select.Option value="scene2">scene2</antd.Select.Option>
                            <antd.Select.Option value="scene3">scene3</antd.Select.Option>
                        </antd.Select>
                    </antd.Form.Item>
                    <antd.Form.Item
                        label="热点描述"
                        name="naviDescription"
                        rules={[
                            {
                                required: false,
                            },
                        ]}
                    >
                        <antd.Input/>
                    </antd.Form.Item>
                </antd.Form>
            </antd.Modal>
        </div>
    );

}


// const SpinLoader = () => {
//     const [spinning, setSpinning] = React.useState(false);
//     const [percent, setPercent] = React.useState(0);
//     const showLoader = () => {
//         setSpinning(true);
//
//     };
//     return (
//         <>
//             <antd.Button onClick={showLoader}>Show fullscreen</antd.Button>
//             <antd.Spin spinning={spinning}  fullscreen={"true"} />
//         </>
//     );
// };

layui.use('slider', function () {
    var slider = layui.slider;

    //渲染
    slider.render({
        elem: '#slideTest1'  //绑定元素
    });
    slider.render({
        elem: '#slideTest2'  //绑定元素
    });
    slider.render({
        elem: '#slideTest3' //绑定元素
    });
    slider.render({
        elem: '#slideTest4'
    })
    slider.render({
        elem: '#slideTest5'
    })
    slider.render({
        elem: '#slideRotationX',
        setTips: (value) => {
            return value;
        },
        min: -360,
        max: 360,
        change: (value) => {
            changeObjectRotation('X', value);
        }
    })
    slider.render({
        elem: '#slideRotationY',
        setTips: (value) => {
            return value;
        },
        min: -360,
        max: 360,
        change: (value) => {
            changeObjectRotation('Y', value);
        }
    })
    slider.render({
        elem: '#slideRotationZ',
        setTips: (value) => {
            return value;
        },
        min: -360,
        max: 360,
        change: (value) => {
            changeObjectRotation('Z', value);
        }
    })
    scaleSlider = slider.render({
        elem: "#slideScale",
        theme: '#1E9FFF',
        setTips: (value) => {
            return value / 10;
        },
        // min: 0.1,
        // max: 5.1,
        change: (value) => {
            changeObjectScale(value);
        }
    })
});

layui.use(['dropdown', 'jquery', 'layer'], () => {
    const dropdown = layui.dropdown;
    const $ = layui.$;
    const layer = layui.layer;

    dropdown.on('click(sceneEditMenu)', (options) => {
        let othis = $(this);
        if (options.id === 1) {
            // 点位拼接

            fetch(extrinsicsUrl, {cache: "reload"})
                .then((response) => response.text())
                .then((text) => {
                    const content = text;
                    console.log(content);
                    const lines = content.split('\n');
                    const matrixCount = parseInt(lines[0]);

                    let currentIndex = 1; // 当前处理的行索引

                    if (entityArr === null) {
                        entityArr = getAllPointClouds(entityGroup);
                    }

                    console.log("entityArr", entityArr);

                    let matrix_arr = [];

                    // 循环读取每个矩阵的内容
                    for (let i = 0; i < matrixCount; i++) {
                        const matrix = [];
                        let transformMatrix = new THREE.Matrix4();
                        const matrix_text = lines.slice(currentIndex, currentIndex + 4);

                        for (let j = 0; j < 4; ++j) {
                            const row = matrix_text[j];
                            const row_array = row.split(/\s+/)
                            matrix.push(row_array);
                        }

                        console.log(matrix);
                        transformMatrix.set(
                            1 * matrix[0][0], 1 * matrix[0][1], 1 * matrix[0][2], 1 * matrix[0][3],
                            1 * matrix[1][0], 1 * matrix[1][1], 1 * matrix[1][2], 1 * matrix[1][3],
                            1 * matrix[2][0], 1 * matrix[2][1], 1 * matrix[2][2], 1 * matrix[2][3],
                            1 * matrix[3][0], 1 * matrix[3][1], 1 * matrix[3][2], 1 * matrix[3][3]
                        )

                        console.log(transformMatrix)
                        console.log(matrixCount - 1 - i)
                        console.log(entityArr[matrixCount - i - 1]);
                        matrix_arr.push(transformMatrix);
                        currentIndex += 4

                    }

                    let dummyMatrix = new THREE.Matrix4();

                    for (let i = 0; i < matrix_arr.length; ++i) {

                        entityArr[i].position.set(0,0,0);
                        entityArr[i].rotation.set(0, -3.14, -3.14);
                        let custom_idx = entityArr[i].customIndex;
                        console.log("custom_idx", custom_idx);

                        // entityArr[i].rotation.set(0,0,0);
                        entityArr[i].applyMatrix4(matrix_arr[custom_idx]);
                        entityArr[i].updateMatrixWorld(true);
                        //amendment the rotation between the dust3r and vr systems
                        entityArr[i].rotateY(-Math.PI)
                        entityArr[i].rotateZ(-Math.PI)

                        // entityArr[i].rotateZ(-3.14)
                        // entityArr[i].rotateY(3.14)

                    }
                })


        } else if (options.id === 2) {
            // 添加场景
            // showAddSkyboxModal();


            // 使用dust3r拼接点位
            axios.get("/dust3r/"+userId+"/"+configurationFileId).then(

                res=>{

                    if(res.status===200){
                        antd.message.success(res.data);
                    }else{
                        antd.message.warn(res.data);
                    }
                }

            ).catch(error => {
                console.error('Error:', error);
                antd.message.error(error.response.data);
            });

        } else if (options.id === 3) {
            // 添加热点
            if (currentSelected !== null && currentSelected.parent.name === 'panoGroup') {
                showAddNaviModal();
            } else {
                antd.message.error("请选中一个场景以添加导航热点");
            }

        } else if (options.id === 4) {
            // 开启选择模式

            transformControl.enabled = true;
            enableSelect = true;
            if (entityArr === null) {
                entityArr = getAllPointClouds(entityGroup);
                console.log("entityArr", entityArr)
            }

        } else if (options.id === 5) {
            // 开启移动物体模式
            //enableSelect = false;
            // transformControl.enabled = true;
            transformControl.showX = true;
            transformControl.showY = true;
            transformControl.showZ = true;
            changeTransformControlMode(transformControl, "translate");

        } else if (options.id === 6) {
            // 开启旋转物体模式
            //enableSelect = false;
            // transformControl.enabled = true;
            transformControl.showX = false;
            transformControl.showY = true;
            transformControl.showZ = false;
            changeTransformControlMode(transformControl, "rotate");

        } else if (options.id === 7) {
            // 开启缩放物体模式
            //enableSelect = false;
            // transformControl.enabled = true;
            transformControl.showX = true;
            transformControl.showY = true;
            transformControl.showZ = true;
            changeTransformControlMode(transformControl, "scale");

        } else if (options.id === 8) {
            // 比例标定
            layer.open({
                title: '全景行走漫游比例标定',
                type: 1,
                btn: ['确认', '取消'],
                content: $('#scaleCalibrationInput'),
                icon: 1
            })
        } else if (options.id === 9) {
            // 保存
            // layer.open({
            //     title: '保存全景行走漫游',
            //     type: 1,
            //     btn: ['确认', '取消'],
            //     content: $('#saveSuccess'),
            //     icon: 1
            //
            // });

            updatePointCloudConfig(scene, projectConfigurationUrl);
            antd.message.success("点云点位保存成功！")
        } else if (options.id === 10) {
            // 生成VR
            exportPointClouds();

        } else if (options.id === 11) {
            // 打印选中物体信息(DEBUG)
            console.log(currentSelected);


        } else if (options.id === 12) {
            // 导出为gltf模型

            //renderer.outputEncoding = THREE.sRGBEncoding;

            // exportGLTF(scene);
            // let sceneConfig = JSON.stringify(scene);
            // const a = document.createElement("a");
            // a.href = window.URL.createObjectURL(new Blob([sceneConfig], {type: "application/json"}));
            // a.download = "sceneCopy.json";
            // a.click();
            // showInfo(scene);
            // exportJsonTree(scene);
            if (entityArr === null) {
                entityArr = getAllPointClouds(entityGroup);
            }

            for (let i = 0; i < entityArr.length; ++i) {
                entityArr[i].rotation.set(0, -3.14, -3.14);
            }

        } else if (options.id === 13) {
            // 锁定物体
            lockObject();

        } else if (options.id === 14) {

            layer.open({
                title: 'Set Transform Matrix',
                type: 1,
                btn: ['确认', '取消'],
                content: $('#transformMatrixInput'),
                icon: 1,
                yes: function (index, layero) {
                    // console.log("matrix_before_init",currentSelected.matrix);
                    console.log("matrixWorld_before_init", currentSelected.matrixWorld);

                    currentSelected.rotation.set(0, 0, 0);


                    currentSelected.position.set(0, 0, 0);

                    console.log("matrix_after_init", currentSelected.matrix);
                    console.log("matrixWorld_after_init", currentSelected.matrixWorld);


                    let inputValue = $('#matrixInput').val()
                    console.log(inputValue)
                    console.log(currentSelected)
                    var textArray = inputValue.split(/\s+/);
                    console.log("textArray", textArray)
                    let transformMatrix = new THREE.Matrix4();
                    transformMatrix.set(
                        1 * textArray[0], 1 * textArray[1], 1 * textArray[2], 1 * textArray[3],
                        1 * textArray[4], 1 * textArray[5], 1 * textArray[6], 1 * textArray[7],
                        1 * textArray[8], 1 * textArray[9], 1 * textArray[10], 1 * textArray[11],
                        1 * textArray[12], 1 * textArray[13], 1 * textArray[14], 1 * textArray[15]
                    )
                    console.log(transformMatrix)
                    let pos = new THREE.Vector3();
                    let rotate = new THREE.Quaternion();
                    let scale = new THREE.Vector3();
                    let euler_from_matrix = new THREE.Euler();
                    let euler_from_quaternion = new THREE.Euler();

                    transformMatrix.decompose(pos, rotate, scale);
                    euler_from_matrix.setFromRotationMatrix(transformMatrix);
                    euler_from_quaternion.setFromQuaternion(rotate)
                    console.log("pos", pos)
                    console.log("rotate", rotate)
                    console.log("scale", scale)
                    console.log("euler_from_matrix", euler_from_matrix);
                    console.log("euler_from_quaternion", euler_from_quaternion)

                    currentSelected.applyMatrix4(transformMatrix);
                    // currentSelected.rotateX(-Math.PI/2)
                    // currentSelected.rotateZ(-Math.PI/2)
                    // currentSelected.matrix.copy(transformMatrix);

                    // currentSelected.matrixAutoUpdate = false;
                    currentSelected.updateMatrixWorld(true);
                    console.log("matrixWorld_after_trans", currentSelected.matrixWorld)
                }


            })
        } else if (options.id === 15) {

            console.log("读取Extrinsics文件");
            document.getElementById('fileInput').click();

            //读取外参矩阵文件

            document.getElementById('fileInput').addEventListener('change', function () {
                const file = this.files[0];
                const reader = new FileReader();

                reader.onload = function (e) {
                    const content = e.target.result;
                    console.log(content); // 这里可以对文件内容进行处理，比如解析外参矩阵
                    const lines = content.split('\n');
                    const matrixCount = parseInt(lines[0]);

                    let currentIndex = 1; // 当前处理的行索引

                    if (entityArr === null) {
                        entityArr = getAllPointClouds(entityGroup);
                    }

                    console.log("entityArr", entityArr);

                    let matrix_arr = [];


                    // 循环读取每个矩阵的内容
                    for (let i = 0; i < matrixCount; i++) {
                        const matrix = [];
                        let transformMatrix = new THREE.Matrix4();
                        const matrix_text = lines.slice(currentIndex, currentIndex + 4);

                        for (let j = 0; j < 4; ++j) {
                            const row = matrix_text[j];
                            const row_array = row.split(/\s+/)
                            matrix.push(row_array);
                        }

                        console.log(matrix);
                        transformMatrix.set(
                            1 * matrix[0][0], 1 * matrix[0][1], 1 * matrix[0][2], 1 * matrix[0][3],
                            1 * matrix[1][0], 1 * matrix[1][1], 1 * matrix[1][2], 1 * matrix[1][3],
                            1 * matrix[2][0], 1 * matrix[2][1], 1 * matrix[2][2], 1 * matrix[2][3],
                            1 * matrix[3][0], 1 * matrix[3][1], 1 * matrix[3][2], 1 * matrix[3][3]
                        )

                        console.log(transformMatrix)
                        console.log(matrixCount - 1 - i)
                        console.log(entityArr[matrixCount - i - 1]);
                        matrix_arr.push(transformMatrix);
                        currentIndex += 4

                    }

                    let dummyMatrix = new THREE.Matrix4();

                    for (let i = 0; i < matrix_arr.length; ++i) {

                        entityArr[i].rotation.set(0, -3.14, -3.14);
                        let custom_idx = entityArr[i].customIndex;
                        console.log("custom_idx", custom_idx);
                        // entityArr[i].position.set(0,0,0);
                        // entityArr[i].rotation.set(0,0,0);
                        entityArr[i].applyMatrix4(matrix_arr[custom_idx]);
                        entityArr[i].updateMatrixWorld(true);
                        //amendment the rotation between the dust3r and vr systems
                        entityArr[i].rotateY(-Math.PI)
                        entityArr[i].rotateZ(-Math.PI)

                        // entityArr[i].rotateZ(-3.14)
                        // entityArr[i].rotateY(3.14)

                    }
                };

                reader.readAsText(file);
            });


        }
    })
})

const app = document.getElementById("app");
const root = ReactDOM.createRoot(app);
root.render(
    <div>
        <AddSkyboxContent></AddSkyboxContent>
        <AddNaviContent></AddNaviContent>
        <SpinLoader></SpinLoader>
    </div>
);



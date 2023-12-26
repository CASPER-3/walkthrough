const userId = sessionStorage.getItem("userId");

const App = () => {

    const [data, setData] = React.useState([]);
    const [imageError, setImageError] = React.useState({});
    const handleImageError = (imageId) => {
        setImageError((prevStates) => ({
            ...prevStates,
            [imageId]: true,
        }));
    };
    const defaultPicUrl = "https://vrlab-static.ljcdn.com/release/web/console-toolkit/static/media/defaultCover.4ffe404a6877dad2e7b5.png";
    React.useEffect(() => {
        axios.get("/project/list")
            .then(response => {
                // 请求成功，处理返回的项目列表
                const projects = response.data.data;
                console.log(projects)
                const projectData = projects.map(project => ({
                    href: '/project/tour?projectId=' + project.projectId,
                    title: project.projectName,
                    avatar: " ",
                    description: project.profile,
                    content: project.creationTime,
                    projectId: project.projectId,
                    configurationId: project.configFileId

                }))
                setData(projectData)
            })
            .catch(error => {
                // 请求失败，处理错误
                console.error('请求失败:', error.message);
            });
    }, []);


    return (<antd.List
        borderd="true"
        itemLayout="vertical"
        size="large"
        pagination={{
            onChange: (page) => {
                console.log(page);
            },
            pageSize: 3,
        }}
        dataSource={data}
        footer={
            <div>
                <b>北京邮电大学</b> 行走漫游管理平台
            </div>
        }
        renderItem={(item) => (
            <antd.List.Item
                key={item.projectId}
                actions={[
                    <antd.Button size='small' onClick={() => {
                        window.open('/project/pointCloudEdit?projectId=' + item.projectId)
                    }}>点云调整</antd.Button>,
                    <antd.Button size='small' onClick={() => {
                        window.open('/project/edit?projectId=' + item.projectId)
                    }}>可视化编辑</antd.Button>,
                    <antd.Button size='small'>分享</antd.Button>,
                ]}
                extra={
                    [
                        // <antd.Tag color="success">success</antd.Tag>,
                    <img
                        width={272}
                        alt="logo"
                        src={imageError[item.projectId]?defaultPicUrl:"/project/getEditSources/" + userId + "/" + item.configurationId + "/thumb.jpg"}
                        onError={()=>{handleImageError(item.projectId)}}
                    />]
                }
            >
                <antd.List.Item.Meta
                    // avatar={<antd.Avatar src={item.avatar} />}
                    title={<a href={item.href} target="_blank">{item.title} </a>}
                    description={item.description === "" ? "暂无介绍" : item.description}
                />
                {item.content}
            </antd.List.Item>
        )}
    />)
};
const app = document.getElementById("app");
const root = ReactDOM.createRoot(app);
root.render(
    <App></App>
);
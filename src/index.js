import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkSTLReader from '@kitware/vtk.js/IO/Geometry/STLReader';
import vtkPLYReader from '@kitware/vtk.js/IO/Geometry/PLYReader';
// 如果需要使用 vtkOFFReader，请确保导入
// import vtkOFFReader from '@kitware/vtk.js/IO/Geometry/OFFReader';
import vtkHttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import vtkInteractorStyleTrackballCamera from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera';

document.getElementById('file-input').addEventListener('change', (event) => {
  const file = event.target.files[0];

  if (file) {
    console.log(`Selected file path: ${file.name}`);

    const fileReader = new FileReader();
    fileReader.onload = function(e) {
      const arrayBuffer = e.target.result;
      const extension = file.name.split('.').pop().toLowerCase();

      // 选择合适的读取器
      let reader;
      if (extension === 'stl') {
        reader = vtkSTLReader.newInstance();
      } else if (extension === 'ply') {
        reader = vtkPLYReader.newInstance();
      } /*else if (extension === 'off') {
        reader = vtkOFFReader.newInstance();
      }*/ else {
        console.error('Unsupported file format');
        return;
      }

      // 使用 HttpDataAccessHelper 将 ArrayBuffer 转换为 Blob URL
      const blob = new Blob([arrayBuffer]);
      const url = URL.createObjectURL(blob);

      vtkHttpDataAccessHelper.fetchBinary(url).then((binary) => {
        reader.parseAsArrayBuffer(binary);

        // 动态调整布局
        adjustLayout();

        // 创建渲染窗口
        const renderWindow = vtkRenderWindow.newInstance();
        const renderer = vtkRenderer.newInstance({ background: [0, 0, 0] });
        renderWindow.addRenderer(renderer);

        const openGLRenderWindow = vtkOpenGLRenderWindow.newInstance();
        openGLRenderWindow.setContainer(document.getElementById('vtk-container'));
        renderWindow.addView(openGLRenderWindow);

        // 获取设备的像素比率
        const devicePixelRatio = window.devicePixelRatio || 1;

        // 设置渲染窗口的大小为设备像素比率的倍数
        openGLRenderWindow.setSize(
          window.innerWidth * devicePixelRatio,
          window.innerHeight * devicePixelRatio
        );

        const interactor = vtkRenderWindowInteractor.newInstance();
        interactor.setView(openGLRenderWindow);
        interactor.initialize();
        interactor.bindEvents(document.getElementById('vtk-container'));
        // 设置交互样式
        const interactorStyle = vtkInteractorStyleTrackballCamera.newInstance();
        interactor.setInteractorStyle(interactorStyle);

        // 创建映射器和演员
        const mapper = vtkMapper.newInstance();
        const actor = vtkActor.newInstance();
        actor.setMapper(mapper);
        renderer.addActor(actor);

        mapper.setInputData(reader.getOutputData());

        // 强制重新渲染页面
        renderer.resetCamera();
        renderWindow.render();

        // 强制触发窗口大小变化事件
        window.dispatchEvent(new Event('resize'));
      }).finally(() => {
        // 释放 Blob URL 以节省内存
        URL.revokeObjectURL(url);
      }).catch(error => {
        console.error('Error parsing the file:', error);
      });
    };
    fileReader.readAsArrayBuffer(file);
  }
});

function adjustLayout() {
  // 修改布局为左右排列
  const body = document.body;
  const leftPane = document.getElementById('left-pane');
  const fileInputContainer = document.getElementById('file-input-container');
  const rightPane = document.getElementById('right-pane');

  body.classList.add('flex-row', 'full-height');
  body.style.alignItems = 'flex-start';

  leftPane.classList.remove('hidden');
  fileInputContainer.classList.add('hidden');

  rightPane.classList.remove('hidden');

  // 确保渲染窗口大小能正确调整
  const vtkContainer = document.getElementById('vtk-container');
  vtkContainer.style.width = '100%';
  vtkContainer.style.height = '100%';
}
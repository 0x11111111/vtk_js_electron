import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkSTLReader from '@kitware/vtk.js/IO/Geometry/STLReader';
import vtkPLYReader from '@kitware/vtk.js/IO/Geometry/PLYReader';
// 如果需要使用 vtkOFFReader，请确保导入
// import vtkOFFReader from '@kitware/vtk.js/IO/Geometry/OFFReader';
import vtkHttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

document.getElementById('file-input').addEventListener('change', (event) => {
  const file = event.target.files[0];

  if (file) {
    console.log(`Selected file path: ${file.name}`);

    const fileReader = new FileReader();
    fileReader.onload = function(e) {
      const arrayBuffer = e.target.result;
      const extension = file.name.split('.').pop().toLowerCase();

      // 创建渲染窗口
      const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        background: [0, 0, 0],
        rootContainer: document.getElementById('vtk-container'),
      });
      const renderer = fullScreenRenderer.getRenderer();
      const renderWindow = fullScreenRenderer.getRenderWindow();

      // 创建映射器和演员
      const mapper = vtkMapper.newInstance();
      const actor = vtkActor.newInstance();
      actor.setMapper(mapper);
      renderer.addActor(actor);

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
        mapper.setInputData(reader.getOutputData());

        // 强制重新渲染页面
        renderer.resetCamera();
        renderWindow.render();
        document.getElementById('vtk-container').style.display = 'block';

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
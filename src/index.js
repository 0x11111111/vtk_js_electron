import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkSTLReader from '@kitware/vtk.js/IO/Geometry/STLReader';
import vtkPLYReader from '@kitware/vtk.js/IO/Geometry/PLYReader';

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
      } else {
        console.error('Unsupported file format');
        return;
      }

      mapper.setInputConnection(reader.getOutputPort());
      reader.parseAsArrayBuffer(arrayBuffer);

      // 强制重新渲染页面
      setTimeout(() => {
        renderer.resetCamera();
        renderWindow.render();
        document.getElementById('vtk-container').style.display = 'block';

        // 强制触发窗口大小变化事件
        window.dispatchEvent(new Event('resize'));
      }, 0);
    };
    fileReader.readAsArrayBuffer(file);
  }
});
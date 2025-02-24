const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');

// Cấu hình đồ thị
let graph = {
  nodes: [],
  edges: [],
};

// Hàm cập nhật danh sách chọn đỉnh bắt đầu
// function updateStartNodeOptions() {
//   const startNodeSelect = document.getElementById('startNode');
//   const endNodeSelect = document.getElementById('endNode');
//   startNodeSelect.innerHTML = ''; // Xóa các tùy chọn cũ
//   endNodeSelect.innerHTML = ''; // Xóa các tùy chọn cũ

//   graph.nodes.forEach(node => {
//     const option = document.createElement('option');
//     option.value = node.id;
//     option.text = node.id;
//     startNodeSelect.appendChild(option);

//     const optionClone = option.cloneNode(true);
//     endNodeSelect.appendChild(optionClone);
//   });
// }

// Hàm lấy dữ liệu từ người dùng
function parseInput() {
  const graphData = document.getElementById('graphData').value.trim();
  const lines = graphData.split('\n').filter(line => line.trim() !== ''); // Loại bỏ dòng trống

  const nodesSet = new Set(); // Lưu trữ các đỉnh duy nhất
  const edges = [];

  // Phân tích từng dòng dữ liệu
  lines.forEach((line, index) => {
    const parts = line.trim().split(/\s+/); // Tách theo khoảng trắng
    if (parts.length === 3) { // Đảm bảo có đủ 3 phần (from, to, weight)
      const [from, to, weight] = parts;
      nodesSet.add(from); // Thêm đỉnh nguồn
      nodesSet.add(to);   // Thêm đỉnh đích
      edges.push({ from, to, weight: parseFloat(weight) });
    } else {
      console.warn(`Dòng ${index + 1} không đúng định dạng: "${line}"`);
    }
  });

  // Tạo danh sách đỉnh và tọa độ
  const nodesArray = Array.from(nodesSet);
  const radius = Math.min(canvas.width, canvas.height) / 2 - 50; // Bán kính hình tròn
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Tạo danh sách các đỉnh với tọa độ
  graph.nodes = nodesArray.map((id, index) => {
    const angle = (index / nodesArray.length) * 2 * Math.PI;
    return {
      id,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
  graph.edges = edges;

  // Log để kiểm tra
  console.log("Nodes:", graph.nodes);
  console.log("Edges:", graph.edges);
}
// Vẽ đồ thị
function drawGraph() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  console.log("Drawing edges:", graph.edges);
  console.log("Drawing nodes:", graph.nodes);

  // Vẽ các cạnh
  graph.edges.forEach(edge => {
    const fromNode = graph.nodes.find(node => node.id === edge.from);
    const toNode = graph.nodes.find(node => node.id === edge.to);

    if (fromNode && toNode) { // Đảm bảo cả hai đỉnh đều tồn tại
      // Vẽ đường nối
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Hiển thị trọng số
      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial'; // Đảm bảo font rõ ràng
      ctx.fillText(edge.weight, midX, midY);
    }
  });

  // Vẽ các đỉnh
  graph.nodes.forEach(node => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#4CAF50';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.stroke();

    // Vẽ tên đỉnh
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '14px Arial'; // Đảm bảo chữ đủ lớn để đọc
    ctx.fillText(node.id, node.x, node.y);
  });
}

function displayResult(message) {
  const resultTextarea = document.getElementById('result');
  resultTextarea.value = message;
}

// Thuật toán DFS
function dfs(start, end) {
  const visited = new Set();
  let found = false;
  let path = [];
  function traverse(node) {
    if (visited.has(node) || found) return;
    visited.add(node);
    path.push(node);
    console.log('DFS:', node);
    if (node === end) {
      found = true;
      console.log('Found:', node);
      displayResult(`DFS Path: ${path.join(' -> ')}`);
      return;
    }
    graph.edges
      .filter(edge => edge.from === node || edge.to === node)
      .forEach(edge => traverse(edge.from === node ? edge.to : edge.from));
    if (!found) path.pop(); // Remove node from path if not found
  }
  traverse(start);
  if (!found) displayResult('DFS: Không tìm thấy đường đi');
}

// Thuật toán BFS
function bfs(start, end) {
  const queue = [start];
  const visited = new Set();
  const prev = {};
  visited.add(start);
  let found = false;

  while (queue.length && !found) {
    const node = queue.shift();
    console.log('BFS:', node);
    if (node === end) {
      found = true;
      console.log('Found:', node);
      let path = [];
      while (node) {
        path.push(node);
        node = prev[node];
      }
      path.reverse();
      displayResult(`BFS Path: ${path.join(' -> ')}`);
      break;
    }
    graph.edges
      .filter(edge => edge.from === node || edge.to === node)
      .forEach(edge => {
        const nextNode = edge.from === node ? edge.to : edge.from;
        if (!visited.has(nextNode)) {
          visited.add(nextNode);
          prev[nextNode] = node;
          queue.push(nextNode);
        }
      });
  }
  if (!found) displayResult('BFS: Không tìm thấy đường đi');
}

// Thuật toán Dijkstra
function dijkstra(start, end) {
  const distances = {};
  const prev = {};
  const pq = new Set(graph.nodes.map(node => node.id));

  graph.nodes.forEach(node => distances[node.id] = Infinity);
  distances[start] = 0;

  while (pq.size) {
    let minNode = Array.from(pq).reduce((a, b) => (distances[a] < distances[b] ? a : b));
    pq.delete(minNode);

    if (minNode === end) {
      console.log('Found:', minNode);
      let path = [];
      while (minNode) {
        path.push(minNode);
        minNode = prev[minNode];
      }
      path.reverse();
      displayResult(`Dijkstra Path: ${path.join(' -> ')}`);
      break;
    }

    graph.edges.filter(edge => edge.from === minNode || edge.to === minNode).forEach(edge => {
      const neighbor = edge.from === minNode ? edge.to : edge.from;
      if (pq.has(neighbor)) {
        const newDist = distances[minNode] + edge.weight;
        if (newDist < distances[neighbor]) {
          distances[neighbor] = newDist;
          prev[neighbor] = minNode;
        }
      }
    });
  }
  if (distances[end] === Infinity) displayResult('Dijkstra: Không tìm thấy đường đi');
}

// Chạy thuật toán
function runAlgorithm(algorithm) {
  parseInput(); // Lấy và phân tích dữ liệu đồ thị
  drawGraph(); // Vẽ lại đồ thị

  const startNodeInput = document.getElementById('startNode').value.trim();
  const endNodeInput = document.getElementById('endNode').value.trim();

  // Kiểm tra xem có nhập giá trị không
  if (!startNodeInput || !endNodeInput) {
    displayResult("Vui lòng nhập điểm đầu và điểm cuối.");
    return;
  }

  // Kiểm tra xem điểm có tồn tại trong đồ thị không
  const startNodeExists = graph.nodes.some(node => node.id === startNodeInput);
  const endNodeExists = graph.nodes.some(node => node.id === endNodeInput);

  if (!startNodeExists || !endNodeExists) {
    displayResult("Điểm đầu hoặc điểm cuối không tồn tại trong đồ thị.");
    return;
  }

  const startNode = startNodeInput;
  const endNode = endNodeInput;

  switch (algorithm) {
    case 'dfs':
      dfs(startNode, endNode);
      break;
    case 'bfs':
      bfs(startNode, endNode);
      break;
    case 'dijkstra':
      dijkstra(startNode, endNode);
      break;
    default:
      console.log('Thuật toán không hợp lệ');
  }
}
// Lắng nghe sự kiện
document.getElementById('run').addEventListener('click', () => {
  const algorithm = document.getElementById('algorithm').value;
  runAlgorithm(algorithm);
});

document.getElementById('drawGraphButton').addEventListener('click', () => {
  parseInput(); // Lấy và phân tích dữ liệu đồ thị
  drawGraph(); // Vẽ lại đồ thị
});

// Khởi tạo canvas
function resizeCanvas() {
  const outputSection = document.getElementById('output-section');
  canvas.width = outputSection.clientWidth - 20; // Trừ padding
  canvas.height = outputSection.clientHeight - 40; // Trừ padding và tiêu đề
}

// Gọi hàm resize khi tải trang và khi cửa sổ thay đổi kích thước
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');

// Cấu hình đồ thị
let graph = {
  nodes: [],
  edges: [],
};

// Hàm cập nhật danh sách chọn đỉnh bắt đầu
function updateStartNodeOptions() {
  const startNodeSelect = document.getElementById('startNode');
  const endNodeSelect = document.getElementById('endNode');
  startNodeSelect.innerHTML = ''; // Xóa các tùy chọn cũ
  endNodeSelect.innerHTML = ''; // Xóa các tùy chọn cũ

  graph.nodes.forEach(node => {
    const option = document.createElement('option');
    option.value = node.id;
    option.text = node.id;
    startNodeSelect.appendChild(option);

    const optionClone = option.cloneNode(true);
    endNodeSelect.appendChild(optionClone);
  });
}

// Hàm lấy dữ liệu từ người dùng
function parseInput() {
  const graphData = document.getElementById('graphData').value.trim();
  const lines = graphData.split('\n');

  const nodesSet = new Set(); // Dùng Set để tránh trùng lặp đỉnh
  const edges = [];

  lines.forEach(line => {
    const parts = line.split(/\s+/); // Tách theo khoảng trắng
    if (parts.length === 3) {
      const [from, to, weight] = parts;
      nodesSet.add(from);
      nodesSet.add(to);
      edges.push({ from, to, weight: parseFloat(weight) });
    }
  });

  // Tạo danh sách đỉnh và cạnh
  graph.nodes = Array.from(nodesSet).map((id, index) => ({
    id,
    x: 100 + (index % 5) * 150, // Xếp đỉnh thành lưới
    y: 100 + Math.floor(index / 5) * 150,
  }));
  graph.edges = edges;

  updateStartNodeOptions(); // Cập nhật danh sách chọn đỉnh bắt đầu
}

// Vẽ đồ thị
function drawGraph() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Vẽ các cạnh
  graph.edges.forEach(edge => {
    const fromNode = graph.nodes.find(node => node.id === edge.from);
    const toNode = graph.nodes.find(node => node.id === edge.to);

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
    ctx.fillText(edge.weight, midX, midY);
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
    ctx.fillText(node.id, node.x, node.y);
  });
}

// Thuật toán DFS
function dfs(start, end) {
  const visited = new Set();
  let found = false;
  function traverse(node) {
    if (visited.has(node) || found) return;
    visited.add(node);
    console.log('DFS:', node);
    if (node === end) {
      found = true;
      console.log('Found:', node);
      return;
    }
    graph.edges
      .filter(edge => edge.from === node || edge.to === node)
      .forEach(edge => traverse(edge.from === node ? edge.to : edge.from));
  }
  traverse(start);
}

// Thuật toán BFS
function bfs(start, end) {
  const queue = [start];
  const visited = new Set();
  visited.add(start);
  let found = false;

  while (queue.length && !found) {
    const node = queue.shift();
    console.log('BFS:', node);
    if (node === end) {
      found = true;
      console.log('Found:', node);
      break;
    }
    graph.edges
      .filter(edge => edge.from === node || edge.to === node)
      .forEach(edge => {
        const nextNode = edge.from === node ? edge.to : edge.from;
        if (!visited.has(nextNode)) {
          visited.add(nextNode);
          queue.push(nextNode);
        }
      });
  }
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
  console.log('Dijkstra:', distances);
}

// Thuật toán Kruskal
function kruskal() {
  const edges = [...graph.edges].sort((a, b) => a.weight - b.weight);
  const parent = {};
  graph.nodes.forEach(node => parent[node.id] = node.id);

  function find(node) {
    if (parent[node] === node) return node;
    return parent[node] = find(parent[node]);
  }

  function union(node1, node2) {
    parent[find(node1)] = find(node2);
  }

  const mst = [];
  edges.forEach(edge => {
    if (find(edge.from) !== find(edge.to)) {
      mst.push(edge);
      union(edge.from, edge.to);
    }
  });
  console.log('Kruskal:', mst);
}

// Chạy thuật toán
function runAlgorithm(algorithm) {
  parseInput(); // Lấy và phân tích dữ liệu đồ thị
  drawGraph(); // Vẽ lại đồ thị

  const startNodeSelect = document.getElementById('startNode');
  const endNodeSelect = document.getElementById('endNode');
  const startNode = startNodeSelect.value;
  const endNode = endNodeSelect.value;
  if (!startNode || !endNode) return;

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
    case 'kruskal':
      kruskal();
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
canvas.width = document.getElementById('output-section').clientWidth;
canvas.height = document.getElementById('output-section').clientHeight;
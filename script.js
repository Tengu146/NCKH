const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');

let graph = {
  nodes: [],
  edges: [],
  directed: false,
  multigraph: false,
};

let foundPath = [];

const manualInputRadio = document.getElementById('manualInput');
const fileInputRadio = document.getElementById('fileInput');
const manualInputSection = document.getElementById('manual-input-section');
const fileInputSection = document.getElementById('file-input-section');
const uploadFileButton = document.getElementById('uploadFileButton');
const fileInput = document.getElementById('graphFile');
const fileNameDisplay = document.getElementById('fileName');

manualInputRadio.addEventListener('change', toggleInputMethod);
fileInputRadio.addEventListener('change', toggleInputMethod);

uploadFileButton.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) {
    fileNameDisplay.textContent = `Đã chọn: ${file.name}`;
    processFile(file);
  } else {
    fileNameDisplay.textContent = 'Chưa có file nào được chọn';
  }
});

function toggleInputMethod() {
  if (manualInputRadio.checked) {
    manualInputSection.style.display = 'block';
    fileInputSection.style.display = 'none';
  } else if (fileInputRadio.checked) {
    manualInputSection.style.display = 'none';
    fileInputSection.style.display = 'block';
    fileNameDisplay.textContent = 'Chưa có file nào được chọn';
    fileInput.value = '';
  }
}

function displayGraphType() {
  let typeText = "Loại đồ thị: ";
  if (graph.multigraph) typeText += "Đa đồ thị ";
  else typeText += "Đồ thị đơn ";
  typeText += graph.directed ? "có hướng" : "vô hướng";
  document.getElementById('graphType').textContent = typeText;
}

function drawCurvedEdge(ctx, x1, y1, x2, y2, index, total) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const offset = 20 * (index - (total - 1) / 2);
  const cx = (x1 + x2) / 2 + offset * Math.cos(angle + Math.PI / 2);
  const cy = (y1 + y2) / 2 + offset * Math.sin(angle + Math.PI / 2);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  ctx.stroke();

  if (graph.directed) {
    const t = 0.75;
    const arrowX = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
    const arrowY = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
    const tangentAngle = Math.atan2(
      2 * (1 - t) * (cy - y1) + 2 * t * (y2 - cy),
      2 * (1 - t) * (cx - x1) + 2 * t * (x2 - cx)
    );
    const headLength = 10;
    const adjustedArrowX = arrowX - 15 * Math.cos(tangentAngle);
    const adjustedArrowY = arrowY - 15 * Math.sin(tangentAngle);

    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
      adjustedArrowX - headLength * Math.cos(tangentAngle - Math.PI / 6),
      adjustedArrowY - headLength * Math.sin(tangentAngle - Math.PI / 6)
    );
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
      adjustedArrowX - headLength * Math.cos(tangentAngle + Math.PI / 6),
      adjustedArrowY - headLength * Math.sin(tangentAngle + Math.PI / 6)
    );
    ctx.stroke();
  }
}

function drawGraph() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;

  graph.directed = document.getElementById('isDirected').checked;
  graph.multigraph = document.getElementById('isMultigraph').checked;

  const edgeGroups = {};
  const oppositeEdges = new Set();
  const directedMultiEdgeGroups = {};

  graph.edges.forEach((edge, index) => {
    let key;
    if (graph.multigraph) {
      key = `${edge.from}->${edge.to}-${index}`;
      if (graph.directed) {
        const multiKey = `${edge.from}-${edge.to}`;
        if (!directedMultiEdgeGroups[multiKey]) directedMultiEdgeGroups[multiKey] = [];
        directedMultiEdgeGroups[multiKey].push({ ...edge, index });
      }
    } else if (graph.directed) {
      key = `${edge.from}-${edge.to}-${index}`;
      const forwardKey = `${edge.from}-${edge.to}`;
      const reverseKey = `${edge.to}-${edge.from}`;
      if (graph.edges.some(e => e.from === edge.to && e.to === edge.from)) {
        oppositeEdges.add(forwardKey);
        oppositeEdges.add(reverseKey);
      }
    } else {
      key = [edge.from, edge.to].sort().join('-');
    }
    if (!edgeGroups[key]) edgeGroups[key] = [];
    edgeGroups[key].push({ ...edge, index });
  });

  for (const key in edgeGroups) {
    const edges = edgeGroups[key];
    edges.forEach((edge, idx) => {
      const fromNode = graph.nodes.find(node => node.id === edge.from);
      const toNode = graph.nodes.find(node => node.id === edge.to);
      if (fromNode && toNode) {
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.5;

        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;

        if (edge.from === edge.to) {
          drawLoop(ctx, fromNode.x, fromNode.y);
          ctx.fillStyle = '#333';
          ctx.font = '12px Arial';
          ctx.fillText(edge.weight, fromNode.x + 25, fromNode.y - 35);
        } else if (graph.multigraph && graph.directed) {
          const multiKey = `${edge.from}-${edge.to}`;
          const multiEdges = directedMultiEdgeGroups[multiKey];
          const multiIdx = multiEdges.findIndex(e => e.index === edge.index);
          drawCurvedEdge(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, multiIdx, multiEdges.length);
          ctx.fillStyle = '#333';
          ctx.font = '12px Arial';
          const offset = 50 * (multiIdx - (multiEdges.length - 1) / 2);
          ctx.fillText(edge.weight, midX + offset, midY + (offset > 0 ? 15 : -15));
        } else if (graph.multigraph) {
          drawCurvedEdge(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, idx, edges.length);
          ctx.fillStyle = '#333';
          ctx.font = '12px Arial';
          const offset = 50 * (idx - (edges.length - 1) / 2);
          ctx.fillText(edge.weight, midX + offset, midY + (offset > 0 ? 15 : -15));
        } else if (graph.directed && oppositeEdges.has(`${edge.from}-${edge.to}`)) {
          const reverseKey = `${edge.to}-${edge.from}`;
          const isReverse = graph.edges.some(e => e.from === edge.to && e.to === edge.from && e.index < edge.index);
          const pairCount = (edgeGroups[key]?.length || 0) + (Object.keys(edgeGroups).filter(k => k.startsWith(reverseKey)).length || 0);
          const idxInGroup = edgeGroups[key].findIndex(e => e.index === edge.index);
          const idx = isReverse
            ? (Object.keys(edgeGroups).filter(k => k.startsWith(reverseKey)).length || 0) + idxInGroup
            : idxInGroup;

          drawCurvedEdge(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, idx, pairCount || 2);
          ctx.fillStyle = '#333';
          ctx.font = '12px Arial';
          const weightOffsetX = isReverse ? 10 : -10;
          const weightOffsetY = isReverse ? 25 : -25;
          ctx.fillText(edge.weight, midX + weightOffsetX, midY + weightOffsetY);
        } else if (graph.directed) {
          drawArrow(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y);
          ctx.fillStyle = '#333';
          ctx.font = '12px Arial';
          ctx.fillText(edge.weight, midX, midY - 10);
        } else {
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.stroke();
          ctx.fillStyle = '#333';
          ctx.font = '12px Arial';
          ctx.fillText(edge.weight, midX, midY - 10);
        }
      }
    });
  }

  if (foundPath.length > 0) {
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    foundPath.forEach((edge, idx) => {
      const fromNode = graph.nodes.find(node => node.id === edge.from);
      const toNode = graph.nodes.find(node => node.id === edge.to);
      if (fromNode && toNode) {
        const key = `${edge.from}-${edge.to}`;
        const reverseKey = `${edge.to}-${edge.from}`;
        const isReverse = graph.edges.some(e => e.from === edge.to && e.to === edge.from && e.index < edge.index);
        const pairCount = (edgeGroups[key]?.length || 0) + (Object.keys(edgeGroups).filter(k => k.startsWith(reverseKey)).length || 0);
        const idxInGroup = edgeGroups[key]?.findIndex(e => e.index === edge.index) ?? 0;
        const idxFinal = isReverse
          ? (Object.keys(edgeGroups).filter(k => k.startsWith(reverseKey)).length || 0) + idxInGroup
          : idxInGroup;

        if (edge.from === edge.to) {
          drawLoop(ctx, fromNode.x, fromNode.y);
        } else if (graph.multigraph && graph.directed && pairCount > 1) {
          drawCurvedEdge(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, idxFinal, pairCount);
        } else if (graph.directed && oppositeEdges.has(key)) {
          drawCurvedEdge(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, idxFinal, pairCount || 2);
        } else if (graph.directed) {
          drawArrow(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y);
        } else {
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.stroke();
        }
      }
    });

    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  graph.nodes.forEach(node => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#66BB6A';
    ctx.fill();
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(node.id, node.x, node.y);

    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  });

  const hasNegativeWeight = graph.edges.some(edge => edge.weight < 0);
  const infoText = `Số nút: ${graph.nodes.length}\nSố cạnh: ${graph.edges.length}\nCó trọng số âm: ${hasNegativeWeight ? 'Có' : 'Không'}`;
  document.getElementById('graphInfo').textContent = infoText;
}

function processFile(file) {
  graph.nodes = [];
  graph.edges = [];
  foundPath = [];
  const nodesSet = new Set();
  const fileExtension = file.name.split('.').pop().toLowerCase();

  if (fileExtension === 'txt' || fileExtension === 'csv') {
    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      parseLines(lines, nodesSet);
      graph.directed = document.getElementById('isDirected').checked;
      graph.multigraph = document.getElementById('isMultigraph').checked;
      generateGraphFromNodes(nodesSet);
      displayGraphType();
      drawGraph();
    };
    reader.readAsText(file);
  } else if (fileExtension === 'xlsx') {
    const reader = new FileReader();
    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      parseLines(rows.map(row => row.join(' ')), nodesSet);
      graph.directed = document.getElementById('isDirected').checked;
      graph.multigraph = document.getElementById('isMultigraph').checked;
      generateGraphFromNodes(nodesSet);
      displayGraphType();
      drawGraph();
    };
    reader.readAsArrayBuffer(file);
  } else {
    displayResult('Định dạng file không được hỗ trợ! Chỉ hỗ trợ .txt, .csv, .xlsx');
  }
}

function parseLines(lines, nodesSet) {
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].trim().split(/[\s,]+/);
    if (parts.length !== 3) {
      displayResult(`Lỗi: Dòng ${i + 1} không đúng định dạng: "${lines[i]}"`);
      return;
    }
    const [from, to, weight] = parts;
    const w = parseFloat(weight);
    if (isNaN(w)) {
      displayResult(`Lỗi: Trọng số ở dòng ${i + 1} không phải số: "${weight}"`);
      return;
    }
    nodesSet.add(from);
    nodesSet.add(to);
    graph.edges.push({ from, to, weight: w, id: `edge-${i}` });
  }
}

function parseManualInput() {
  graph.nodes = [];
  graph.edges = [];
  foundPath = [];
  const nodesSet = new Set();
  const graphData = document.getElementById('graphData').value.trim();
  const lines = graphData.split('\n').filter(line => line.trim() !== '');

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length !== 3) {
      displayResult(`Lỗi: Dòng ${i + 1} không đúng định dạng: "${lines[i]}"`);
      return false;
    }
    const [from, to, weight] = parts;
    const w = parseFloat(weight);
    if (isNaN(w)) {
      displayResult(`Lỗi: Trọng số ở dòng ${i + 1} không phải số: "${weight}"`);
      return false;
    }
    nodesSet.add(from);
    nodesSet.add(to);
    graph.edges.push({ from, to, weight: w, id: `edge-${i}` });
  }
  graph.directed = document.getElementById('isDirected').checked;
  graph.multigraph = document.getElementById('isMultigraph').checked;
  generateGraphFromNodes(nodesSet);
  displayGraphType();
  return true;
}

function generateGraphFromNodes(nodesSet) {
  const nodesArray = Array.from(nodesSet);
  const radius = Math.min(canvas.width, canvas.height) / 2 - 50;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  graph.nodes = nodesArray.map((id, index) => {
    const angle = (index / nodesArray.length) * 2 * Math.PI;
    return {
      id,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
}

function drawArrow(ctx, fromX, fromY, toX, toY) {
  const headLength = 10;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);
  const offset = 15;

  const adjustedToX = toX - offset * Math.cos(angle);
  const adjustedToY = toY - offset * Math.sin(angle);

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(adjustedToX, adjustedToY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(adjustedToX, adjustedToY);
  ctx.lineTo(adjustedToX - headLength * Math.cos(angle - Math.PI / 6), adjustedToY - headLength * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(adjustedToX, adjustedToY);
  ctx.lineTo(adjustedToX - headLength * Math.cos(angle + Math.PI / 6), adjustedToY - headLength * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

function drawLoop(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x + 25, y - 25, 15, 0, 2 * Math.PI);
  ctx.stroke();
}

function displayResult(message) {
  document.getElementById('result').value = message;
}

function clearGraph() {
  graph.nodes = [];
  graph.edges = [];
  foundPath = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  displayResult('Đồ thị đã được xóa.');
  document.getElementById('graphInfo').textContent = 'Chưa có dữ liệu.';
  document.getElementById('graphType').textContent = 'Loại đồ thị: Chưa xác định';
}

function getNeighbors(node) {
  const neighbors = new Set();
  
  graph.edges.forEach(edge => {
    if (edge.from === node) {
      neighbors.add(edge.to);
    }
    if (!graph.directed && edge.to === node) {
      neighbors.add(edge.from);
    }
  });
  
  return Array.from(neighbors);
}

function dfsGeneral() {
  const visited = new Set();
  const traversalOrder = [];
  const edgesUsed = [];

  function dfs(node) {
    if (visited.has(node)) return;
    visited.add(node);
    traversalOrder.push(node);

    const neighbors = getNeighbors(node);
    for (let neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        edgesUsed.push({ from: node, to: neighbor });
        dfs(neighbor);
      }
    }
  }

  graph.nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  });

  displayResult(`DFS (toàn đồ thị): ${traversalOrder.join(' -> ')}`);
  foundPath = edgesUsed;
  drawGraph();
}

function bfsGeneral() {
  const visited = new Set();
  const traversalOrder = [];
  const edgesUsed = [];

  function bfs(start) {
    const queue = [start];
    visited.add(start);

    while (queue.length > 0) {
      const node = queue.shift();
      traversalOrder.push(node);

      const neighbors = getNeighbors(node);
      for (let neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
          edgesUsed.push({ from: node, to: neighbor });
        }
      }
    }
  }

  graph.nodes.forEach(node => {
    if (!visited.has(node.id)) {
      bfs(node.id);
    }
  });

  displayResult(`BFS (toàn đồ thị): ${traversalOrder.join(' -> ')}`);
  foundPath = edgesUsed;
  drawGraph();
}

function dfs(start) {
  const visited = new Set();
  const path = [];
  const edgesUsed = [];

  function traverse(node) {
    if (visited.has(node)) return;
    visited.add(node);
    path.push(node);

    graph.edges
      .filter(edge => edge.from === node && (!graph.directed || edge.to !== node))
      .forEach(edge => {
        if (!visited.has(edge.to)) {
          edgesUsed.push({ from: node, to: edge.to });
          traverse(edge.to);
        }
      });
  }

  traverse(start);

  displayResult(`DFS Order: ${path.join(' -> ')}`);
  foundPath = edgesUsed;
  drawGraph();

  const unvisited = graph.nodes.filter(node => !visited.has(node.id));
  if (unvisited.length > 0) {
    displayResult(
      `DFS Order: ${path.join(' -> ')}\n` +
      `Lưu ý: Các nút ${unvisited.map(n => n.id).join(', ')} không được duyệt vì không liên thông với ${start}`
    );
  }
}

function bfs(start) {
  const queue = [start];
  const visited = new Set();
  const path = [];
  const edgesUsed = [];
  visited.add(start);
  path.push(start);

  while (queue.length) {
    const node = queue.shift();
    graph.edges
      .filter(edge => edge.from === node && (!graph.directed || edge.to !== node))
      .forEach(edge => {
        const nextNode = edge.to;
        if (!visited.has(nextNode)) {
          visited.add(nextNode);
          queue.push(nextNode);
          path.push(nextNode);
          edgesUsed.push({ from: node, to: nextNode });
        }
      });
  }

  displayResult(`BFS Order: ${path.join(' -> ')}`);
  foundPath = edgesUsed;
  drawGraph();

  const unvisited = graph.nodes.filter(node => !visited.has(node.id));
  if (unvisited.length > 0) {
    displayResult(
      `BFS Order: ${path.join(' -> ')}\n` +
      `Lưu ý: Các nút ${unvisited.map(n => n.id).join(', ')} không được duyệt vì không liên thông với ${start}`
    );
  }
}

function dijkstra(start, end) {
  const distances = {};
  const prev = {};
  const pq = new Set(graph.nodes.map(node => node.id));
  const edgesUsed = [];

  graph.nodes.forEach(node => distances[node.id] = Infinity);
  distances[start] = 0;

  while (pq.size) {
    let minNode = Array.from(pq).reduce((a, b) => (distances[a] < distances[b] ? a : b));
    pq.delete(minNode);

    if (minNode === end) {
      let path = [];
      let current = minNode;
      while (current) {
        path.push(current);
        if (prev[current]) {
          edgesUsed.push({ from: prev[current], to: current });
        }
        current = prev[current];
      }
      path.reverse();
      displayResult(`Dijkstra Path: ${path.join(' -> ')}\nTotal weight: ${distances[end]}`);
      foundPath = edgesUsed;
      drawGraph();
      return;
    }

    graph.edges
      .filter(edge => edge.from === minNode && (!graph.directed || edge.to !== minNode))
      .forEach(edge => {
        const neighbor = edge.to;
        if (pq.has(neighbor)) {
          const newDist = distances[minNode] + edge.weight;
          if (newDist < distances[neighbor]) {
            distances[neighbor] = newDist;
            prev[neighbor] = minNode;
          }
        }
      });
  }
  displayResult('Dijkstra: Không tìm thấy đường đi');
}

function kruskal() {
  if (graph.directed) {
    displayResult('Kruskal chỉ áp dụng cho đồ thị vô hướng!');
    return;
  }
  const parent = {};
  const rank = {};

  function find(node) {
    if (!parent[node]) parent[node] = node;
    if (parent[node] !== node) parent[node] = find(parent[node]);
    return parent[node];
  }

  function union(node1, node2) {
    const root1 = find(node1);
    const root2 = find(node2);
    if (root1 !== root2) {
      if (!rank[root1]) rank[root1] = 0;
      if (!rank[root2]) rank[root2] = 0;
      if (rank[root1] < rank[root2]) parent[root1] = root2;
      else if (rank[root1] > rank[root2]) parent[root2] = root1;
      else {
        parent[root2] = root1;
        rank[root1]++;
      }
    }
  }

  const sortedEdges = [...graph.edges].sort((a, b) => a.weight - b.weight);
  const mstEdges = [];
  let totalWeight = 0;

  sortedEdges.forEach(edge => {
    if (find(edge.from) !== find(edge.to)) {
      union(edge.from, edge.to);
      mstEdges.push(edge);
      totalWeight += edge.weight;
    }
  });

  foundPath = mstEdges.map(edge => ({ from: edge.from, to: edge.to }));
  displayResult(`Kruskal MST:\n${mstEdges.map(e => `${e.from} -> ${e.to} (${e.weight})`).join('\n')}\nTotal weight: ${totalWeight}`);
  drawGraph();
}

function prim() {
  if (graph.directed) {
    displayResult('Prim chỉ áp dụng cho đồ thị vô hướng!');
    return;
  }
  if (graph.nodes.length === 0) {
    displayResult('Đồ thị không có nút nào!');
    return;
  }

  const visited = new Set();
  const mstEdges = [];
  let totalWeight = 0;

  const startNode = graph.nodes[0].id;
  visited.add(startNode);

  const availableEdges = graph.multigraph
    ? [...graph.edges]
    : graph.edges.reduce((acc, edge) => {
        const key = [edge.from, edge.to].sort().join('-');
        if (!acc[key] || acc[key].weight > edge.weight) {
          acc[key] = edge;
        }
        return acc;
      }, {});

  const edgesList = graph.multigraph ? availableEdges : Object.values(availableEdges);

  while (visited.size < graph.nodes.length) {
    let minEdge = null;
    let minWeight = Infinity;

    edgesList.forEach(edge => {
      const fromIn = visited.has(edge.from);
      const toIn = visited.has(edge.to);
      if (fromIn !== toIn && edge.weight < minWeight) {
        minEdge = edge;
        minWeight = edge.weight;
      }
    });

    if (!minEdge) {
      const unvisited = graph.nodes.filter(node => !visited.has(node.id)).map(n => n.id);
      displayResult(
        `Prim MST:\n${mstEdges.map(e => `${e.from} -> ${e.to} (${e.weight})`).join('\n')}\n` +
        `Total weight: ${totalWeight}\n` +
        `Lưu ý: Đồ thị không liên thông, các nút chưa được thêm vào MST: ${unvisited.join(', ')}`
      );
      foundPath = mstEdges.map(edge => ({ from: edge.from, to: edge.to }));
      drawGraph();
      return;
    }

    mstEdges.push(minEdge);
    totalWeight += minEdge.weight;
    visited.add(minEdge.from);
    visited.add(minEdge.to);
  }

  foundPath = mstEdges.map(edge => ({ from: edge.from, to: edge.to }));
  displayResult(
    `Prim MST:\n${mstEdges.map(e => `${e.from} -> ${e.to} (${e.weight})`).join('\n')}\n` +
    `Total weight: ${totalWeight}`
  );
  drawGraph();
}

function bellmanFord(start) {
  const distances = {};
  const prev = {};
  const edgesUsed = [];

  graph.nodes.forEach(node => {
    distances[node.id] = Infinity;
    prev[node.id] = null;
  });
  distances[start] = 0;

  for (let i = 0; i < graph.nodes.length - 1; i++) {
    graph.edges.forEach(edge => {
      const u = edge.from;
      const v = edge.to;
      const w = edge.weight;
      if (distances[u] !== Infinity && distances[u] + w < distances[v]) {
        distances[v] = distances[u] + w;
        prev[v] = u;
      }
      if (!graph.directed && distances[v] !== Infinity && distances[v] + w < distances[u]) {
        distances[u] = distances[v] + w;
        prev[u] = v;
      }
    });
  }

  for (let edge of graph.edges) {
    const u = edge.from;
    const v = edge.to;
    const w = edge.weight;
    if (distances[u] !== Infinity && distances[u] + w < distances[v]) {
      displayResult('Bellman-Ford: Đồ thị chứa chu trình âm!');
      foundPath = [];
      return;
    }
    if (!graph.directed && distances[v] !== Infinity && distances[v] + w < distances[u]) {
      displayResult('Bellman-Ford: Đồ thị chứa chu trình âm!');
      foundPath = [];
      return;
    }
  }

  let result = 'Bellman-Ford Distances from ' + start + ':\n';
  graph.nodes.forEach(node => {
    if (distances[node.id] !== Infinity) {
      result += `${start} -> ${node.id}: ${distances[node.id]}\n`;
    } else {
      result += `${start} -> ${node.id}: Không có đường đi\n`;
    }
  });

  graph.nodes.forEach(node => {
    if (prev[node.id] !== null) {
      edgesUsed.push({ from: prev[node.id], to: node.id });
    }
  });

  displayResult(result);
  foundPath = edgesUsed;
  drawGraph();
}

function floyd() {
  const dist = {};
  const next = {};

  graph.nodes.forEach(u => {
    dist[u.id] = {};
    next[u.id] = {};
    graph.nodes.forEach(v => {
      dist[u.id][v.id] = u.id === v.id ? 0 : Infinity;
      next[u.id][v.id] = null;
    });
  });

  graph.edges.forEach(edge => {
    dist[edge.from][edge.to] = edge.weight;
    next[edge.from][edge.to] = edge.to;
    if (!graph.directed) {
      dist[edge.to][edge.from] = edge.weight;
      next[edge.to][edge.from] = edge.from;
    }
  });

  graph.nodes.forEach(k => {
    graph.nodes.forEach(i => {
      graph.nodes.forEach(j => {
        if (dist[i.id][k.id] + dist[k.id][j.id] < dist[i.id][j.id]) {
          dist[i.id][j.id] = dist[i.id][k.id] + dist[k.id][j.id];
          next[i.id][j.id] = next[i.id][k.id];
        }
      });
    });
  });

  const startNode = document.getElementById('startNode').value.trim();
  const endNode = document.getElementById('endNode').value.trim();

  if (!startNode || !endNode) {
    let result = 'Floyd-Warshall Distances:\n';
    graph.nodes.forEach(u => {
      graph.nodes.forEach(v => {
        if (dist[u.id][v.id] !== Infinity && u.id !== v.id) {
          result += `${u.id} -> ${v.id}: ${dist[u.id][v.id]}\n`;
        }
      });
    });
    displayResult(result);
    return;
  }

  if (dist[startNode][endNode] === Infinity) {
    displayResult('Floyd-Warshall: Không tìm thấy đường đi!');
    return;
  }

  let path = [startNode];
  const edgesUsed = [];
  while (path[path.length - 1] !== endNode) {
    const current = path[path.length - 1];
    const nextNode = next[current][endNode];
    path.push(nextNode);
    edgesUsed.push({ from: current, to: nextNode });
  }

  displayResult(`Floyd-Warshall Path: ${path.join(' -> ')}\nTotal weight: ${dist[startNode][endNode]}`);
  foundPath = edgesUsed;
  drawGraph();
}

function runAlgorithm(algorithm) {
  if (!graph.nodes.length || !graph.edges.length) {
    displayResult('Vui lòng nhập dữ liệu đồ thị trước!');
    return;
  }

  const startNode = document.getElementById('startNode').value.trim();
  const endNode = document.getElementById('endNode').value.trim();

  if (!['dfsGeneral', 'bfsGeneral', 'prim', 'kruskal'].includes(algorithm)) {
    if (!startNode) {
      displayResult('Vui lòng nhập điểm đầu!');
      return;
    }
    const startNodeExists = graph.nodes.some(node => node.id === startNode);
    if (!startNodeExists) {
      displayResult('Điểm đầu không tồn tại trong đồ thị!');
      return;
    }
  }

  const endNodeExists = graph.nodes.some(node => node.id === endNode);
  if (['dijkstra', 'floyd'].includes(algorithm)) {
    if (!endNode) {
      displayResult('Vui lòng nhập điểm cuối!');
      return;
    }
    if (!endNodeExists) {
      displayResult('Điểm cuối không tồn tại trong đồ thị!');
      return;
    }
  }

  const hasNegativeWeight = graph.edges.some(edge => edge.weight < 0);
  if (hasNegativeWeight) {
    if (algorithm === 'dijkstra') {
      displayResult('Dijkstra không hỗ trợ trọng số âm! Vui lòng dùng Bellman-Ford hoặc Floyd-Warshall.');
      return;
    } else if (algorithm === 'kruskal' || algorithm === 'prim') {
      displayResult(`${algorithm.charAt(0).toUpperCase() + algorithm.slice(1)} không đảm bảo kết quả đúng với trọng số âm!`);
    }
  }

  switch (algorithm) {
    case 'dfs':
      dfs(startNode);
      break;
    case 'bfs':
      bfs(startNode);
      break;
    case 'dfsGeneral':
      dfsGeneral();
      break;
    case 'bfsGeneral':
      bfsGeneral();
      break;
    case 'dijkstra':
      dijkstra(startNode, endNode);
      break;
    case 'kruskal':
      kruskal();
      break;
    case 'prim':
      prim();
      break;
    case 'bellmanFord':
      bellmanFord(startNode);
      break;
    case 'floyd':
      floyd();
      break;
    default:
      displayResult('Thuật toán không hợp lệ');
  }
}

document.getElementById('run').addEventListener('click', () => {
  const algorithm = document.getElementById('algorithm').value;
  runAlgorithm(algorithm);
});

document.getElementById('drawGraphButton').addEventListener('click', () => {
  if (manualInputRadio.checked) {
    const isValidInput = parseManualInput();
    if (isValidInput) drawGraph();
  } else {
    displayResult('Vui lòng chọn file trước khi vẽ đồ thị!');
  }
});

document.getElementById('clearGraphButton').addEventListener('click', () => {
  clearGraph();
});

function resizeCanvas() {
  const outputSection = document.getElementById('output-section');
  canvas.width = outputSection.clientWidth - 20;
  canvas.height = outputSection.clientHeight - 40;
  drawGraph();
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

toggleInputMethod();
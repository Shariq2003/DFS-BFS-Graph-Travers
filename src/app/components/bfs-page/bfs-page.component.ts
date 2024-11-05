import { Component, AfterViewInit, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Title } from '@angular/platform-browser';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-bfs-page',
  standalone: true,
  imports: [RouterModule, FormsModule, NavbarComponent],
  templateUrl: './bfs-page.component.html',
  styleUrls: ['./bfs-page.component.css'],
})
export class BfsPageComponent implements AfterViewInit, OnInit {
  private nodes: { label: string; x: number; y: number }[] = [];
  private edges: [number, number][] = [];
  private bfsTimeout: any;
  public explanation: string = '';
  private bfsCanvas!: HTMLCanvasElement; // Use '!' to indicate it's definitely assigned later
  private maxDepth: number = 0; // New property to track maximum depth

  customNodeInput: string = '';
  customEdgeInput: string = '';
  isDropdownOpen: boolean = false;
  private finalPath: number[] = []; // To store the final path taken

  constructor(private authService: AuthService,private titleService: Title) {}

  ngOnInit(): void {
    this.titleService.setTitle('GraphExplorer Pro | BFS');
  }

  ngAfterViewInit(): void {
    this.bfsCanvas = document.getElementById('bfs-canvas') as HTMLCanvasElement;
    const bfsCtx = this.bfsCanvas.getContext('2d')!;
    this.adjustCanvasSize();
    this.drawGraph(bfsCtx);
  }

  public predefinedGraphs: any = {
    graph1: {
      nodes: 'A,B,C,D',
      edges: '0-1;0-2;1-3;0-3;1-2',
    },
    graph2: {
      nodes: 'E,F,G,H',
      edges: '0-1;1-2;2-3;0-2',
    },
    graph3: {
      nodes: 'I,J,K,L,M',
      edges: '0-1;1-2;2-3;3-4;1-2;1-4',
    },
  };

  loadPredefinedGraph(event: Event) {
    const selectedGraph = (event.target as HTMLSelectElement).value;
    if (selectedGraph && this.predefinedGraphs[selectedGraph]) {
      this.customNodeInput = this.predefinedGraphs[selectedGraph].nodes;
      this.customEdgeInput = this.predefinedGraphs[selectedGraph].edges;
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  private adjustCanvasSize(): void {
    const height = Math.max(400, this.maxDepth * 75);
    this.bfsCanvas.height = height;
  }

  public startBFSTraversal(): void {
    const bfsCtx = this.bfsCanvas.getContext('2d')!;
    this.positionNodes();
    this.bfsTraversalVisualization(bfsCtx);
  }

  private positionNodes(): void {
    const root = 0; // Assume BFS starts at node 0 or any other root node
    const levelGap = 80; // Vertical gap between levels
    const nodeGap = 80; // Horizontal gap between nodes in the same level
    const levels: { [key: number]: number[] } = {}; // Store nodes per level
    const visited: boolean[] = new Array(this.nodes.length).fill(false);
    const queue: number[] = [];

    queue.push(root);
    visited[root] = true;
    levels[0] = [root]; // Root is at level 0

    let currentLevel = 1;

    this.explanation = `Start Node: ${this.nodes[0].label}`;

    while (queue.length > 0) {
      const node = queue.shift()!;

    //this.explanation += `Current: ${this.nodes[node].label}\n`;

      // Find the current node level by converting level strings to numbers
      const currentNodeLevel = Object.keys(levels)
        .map(level => parseInt(level))
        .find((level) => levels[level].includes(node)) || 0;

      const nextLevelNodes: number[] = [];

      // Find all neighbors (children) of the current node
      this.edges.forEach((edge) => {
        const [from, to] = edge;

        // Check if the node is either 'from' or 'to' and the other is unvisited
        const neighbor = from === node ? to : from === node ? to : null;

        if (neighbor !== null && !visited[neighbor]) {
          if (!levels[currentLevel]) {
            levels[currentLevel] = [];
          }
          levels[currentLevel].push(neighbor);
          visited[neighbor] = true;
          queue.push(neighbor);
        }
      });

      currentLevel++;
    }

    this.maxDepth = currentLevel; // Set the maximum depth

    // Assign node positions based on the calculated levels
    Object.keys(levels).forEach((levelStr) => {
      const level = parseInt(levelStr); // Convert level keys back to numbers
      const nodesAtThisLevel = levels[level];
      nodesAtThisLevel.forEach((node, index) => {
        this.nodes[node].x = index * nodeGap + 50; // Horizontal spacing
        this.nodes[node].y = level * levelGap + 50; // Vertical spacing
      });
    });
  }

  private drawGraph(
    ctx: CanvasRenderingContext2D,
    queue: number[] = [],
    processingNode: number | null = null,
    processed: number[] = []
  ): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = '#000';

    // Draw edges (including cyclic connections)
    this.edges.forEach((edge) => {
      const [from, to] = edge;
      ctx.beginPath();
      ctx.moveTo(this.nodes[from].x, this.nodes[from].y);
      ctx.lineTo(this.nodes[to].x, this.nodes[to].y);
      ctx.stroke();

      // If there's a cyclic connection, highlight it
      if (from === to) {
        ctx.strokeStyle = 'green'; // Highlight cyclic connections
        ctx.arc(this.nodes[from].x, this.nodes[from].y, 30, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });

    // Draw nodes
    this.nodes.forEach((node, index) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);

      // Determine the fill color based on the node state
      if (processingNode === index) {
        ctx.fillStyle = 'yellow';
      } else if (queue.includes(index)) {
        ctx.fillStyle = 'blue';
      } else if (processed.includes(index)) {
        ctx.fillStyle = 'red';
      } else {
        ctx.fillStyle = 'white';
      }

      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'black';
      ctx.fillText(node.label, node.x - 5, node.y + 5);
    });
  }

  private bfsTraversalVisualization(ctx: CanvasRenderingContext2D): void {
    const queueElement = document.getElementById('queue-content') as HTMLElement;
    const processingElement = document.getElementById('processing-content') as HTMLElement;
    const processedElement = document.getElementById('processed-content') as HTMLElement;
    const pathContentElement = document.getElementById('path-content') as HTMLElement;

    queueElement.innerHTML = '';
    processingElement.innerHTML = '';
    processedElement.innerHTML = '';
    pathContentElement.innerHTML = '';

    const visited: number[] = [];
    const queue: number[] = [0];
    let currentPath: number[] = [];

    queueElement.innerHTML = this.nodes[0]?.label || '';

    const processNextNode = (): void => {
      if (queue.length > 0) {
        const node: number = queue.shift()!;

        if (!visited.includes(node)) {
          currentPath.push(node);
          pathContentElement.innerHTML = currentPath
            .map(index => this.nodes[index].label)
            .join(' => ');

          processingElement.innerHTML = this.nodes[node].label;
          this.drawGraph(ctx, queue, node, visited);

          this.bfsTimeout = setTimeout(() => {
            visited.push(node);
            processedElement.innerHTML = visited
              .map((index) => this.nodes[index].label)
              .join(', ');
            queueElement.innerHTML = queue
              .map((index) => this.nodes[index].label)
              .join(' => ');

            const neighbors: number[] = this.edges
              .filter((edge) => edge[0] === node && !visited.includes(edge[1]))
              .map((edge) => edge[1]);

            queue.push(...neighbors);
            this.explanation += `<br>Visited: ${this.nodes[node].label}`;

            this.drawGraph(ctx, queue, node, visited);
            this.bfsTimeout = setTimeout(processNextNode, 2000);
          }, 1500);
        } else {
          currentPath.pop();
          processNextNode();
        }
      } else {
        this.finalPath = visited;
        this.highlightFinalPath(ctx);
        this.explanation += `<br>Completed traversal`;
      }
    };

    processNextNode();
  }

  private highlightFinalPath(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 3;

    const pathContentElement = document.getElementById('path-content') as HTMLElement;
    pathContentElement.innerHTML = this.finalPath
      .map(index => this.nodes[index].label)
      .join(' => ');

    for (let i = 0; i < this.finalPath.length - 1; i++) {
      const from = this.finalPath[i];
      const to = this.finalPath[i + 1];

      ctx.beginPath();
      ctx.moveTo(this.nodes[from].x, this.nodes[from].y);
      ctx.lineTo(this.nodes[to].x, this.nodes[to].y);
      ctx.stroke();
    }

    this.finalPath.forEach((index) => {
      ctx.beginPath();
      ctx.arc(this.nodes[index].x, this.nodes[index].y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = 'orange';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'black';
      ctx.fillText(this.nodes[index].label, this.nodes[index].x - 5, this.nodes[index].y + 5);
    });

    this.finalPath = [];
  }

  public onLogout(): void {
    this.authService.logout();
  }

  public resetBFS(): void {
    const bfsCanvas = document.getElementById('bfs-canvas') as HTMLCanvasElement;
    const bfsCtx = bfsCanvas.getContext('2d')!;
    bfsCtx.clearRect(0, 0, bfsCanvas.width, bfsCanvas.height);
    document.getElementById('queue-content')!.innerHTML = '';
    document.getElementById('processing-content')!.innerHTML = '';
    document.getElementById('processed-content')!.innerHTML = '';
    document.getElementById('path-content')!.innerHTML = '';

    if (this.bfsTimeout) {
      clearTimeout(this.bfsTimeout);
    }
  }

  public scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleBFSCard() {
    const bfsCard = document.getElementById('bfs-card');
    if (bfsCard) {
      bfsCard.classList.toggle('hidden');
    }
  }

  public clearForm(): void {
    this.customNodeInput = '';
    this.customEdgeInput = '';
  }

  // New Methods for Custom Graph Input
  public handleCustomGraphInput(): void {
    if (this.validateCustomNodes() && this.validateCustomEdges()) {
      this.parseCustomNodes();
      this.parseCustomEdges();
      this.positionNodes();
      this.adjustCanvasSize();
      const bfsCtx = this.bfsCanvas.getContext('2d')!;
      this.drawGraph(bfsCtx);
      this.bfsCanvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private validateCustomNodes(): boolean {
    const nodeInput = this.customNodeInput.trim().split(',');

    // Check for empty input or empty labels
    if (nodeInput.length === 0 || nodeInput.some(label => label.trim() === '')) {
      this.showToast('Node input is invalid. Ensure all nodes have non-empty labels.'); // Changed alert to toast
      return false;
    }

    // Check for duplicate labels
    const uniqueLabels = new Set(nodeInput.map(label => label.trim()));
    if (uniqueLabels.size !== nodeInput.length) {
      this.showToast('Node input contains duplicate labels. Ensure all nodes have unique labels.'); // Changed alert to toast
      return false;
    }

    return true;
  }

  private validateCustomEdges(): boolean {
    const edgeInput = this.customEdgeInput.trim().split(';');

    // Check for proper edge formatting (must contain at least one '-')
    for (const edge of edgeInput) {
      const nodes = edge.split('-');
      if (nodes.length !== 2 || isNaN(Number(nodes[0])) || isNaN(Number(nodes[1]))) {
        this.showToast(`Invalid edge format: ${edge}. Edges should be formatted as 'from-to', where 'from' and 'to' are valid node indices.`); // Changed alert to toast
        return false;
      }

      // Check if the node indices are within bounds
      const from = Number(nodes[0]);
      const to = Number(nodes[1]);
    }

    return true;
  }

  private parseCustomNodes(): void {
    const nodeInput = this.customNodeInput.trim().split(',');

    // Check for empty input or invalid formats
    if (nodeInput.length === 0 || nodeInput.some(label => label.trim() === '')) {
      this.showToast('Invalid node input format. Please enter valid node labels separated by commas.'); // Changed alert to toast
      this.nodes = []; // Reset nodes to avoid further issues
      return;
    }

    this.nodes = nodeInput.map((label, index) => {
      return {
        label: label.trim(),
        x: 100 + 100 * (index % 5),
        y: 100 + 100 * Math.floor(index / 5),
      };
    });
  }

  private parseCustomEdges(): void {
    const edgeInput = this.customEdgeInput.trim().split(';');

    // Check for empty input or invalid formats
    if (edgeInput.length === 0 || edgeInput.some(edge => edge.trim() === '')) {
      this.showToast('Invalid edge input format. Please enter valid edges in the format "from-to" separated by semicolons.'); // Changed alert to toast
      this.edges = []; // Reset edges to avoid further issues
      return;
    }

    // Validate edge format and update edges
    const newEdges: [number, number][] = [];
    for (const edge of edgeInput) {
      const [from, to] = edge.split('-').map(Number);

      // Check for valid number conversion
      if (isNaN(from) || isNaN(to) || from < 0 || to < 0 || from >= this.nodes.length || to >= this.nodes.length) {
        this.showToast(`Invalid edge: ${edge}. Please ensure both nodes are valid indices.`); // Changed alert to toast
        this.edges = []; // Reset edges if any edge is invalid
        return;
      }
      newEdges.push([from, to]);
    }

    this.edges = newEdges;
  }

  public downloadCanvas(): void {
    const link = document.createElement('a');
    link.download = 'bfs-canvas.png'; // Name for the downloaded file
    link.href = this.bfsCanvas.toDataURL(); // Get the data URL of the canvas
    link.click(); // Trigger the download
  }

  private showToast(message: string): void {
    // Implement your toast notification logic here
    console.log(message); // Placeholder for actual toast implementation
  }
}

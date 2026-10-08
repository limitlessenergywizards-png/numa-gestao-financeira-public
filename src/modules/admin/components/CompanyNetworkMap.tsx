'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, Building2, GitBranch, Focus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NetworkNode } from './NetworkNode';
import { NetworkConnection } from './NetworkConnection';
import { ParticleBackground } from './ParticleBackground';
import { GlassmorphismPanel } from './GlassmorphismPanel';
import { ErrorBoundary } from '@/components/shared';
import * as THREE from 'three';

function NetworkMapFallback() {
  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Mapa 3D indisponível</p>
        <p className="text-xs mt-1">Seu dispositivo pode não suportar WebGL</p>
      </div>
    </div>
  );
}

interface Company {
  id: string;
  name: string;
  trading_name?: string;
  is_headquarters: boolean;
  parent_company_id?: string | null;
  created_at: string;
  userCount?: number;
}

interface CompanyNetworkMapProps {
  companies: Company[];
  onSelectCompany?: (company: Company) => void;
  onEditCompany?: (companyId: string) => void;
}

interface NetworkNodeData {
  id: string;
  name: string;
  tradingName?: string;
  type: 'headquarters' | 'branch';
  position: [number, number, number];
  userCount: number;
  monthlyVolume: number;
  parentId?: string;
  createdAt: string;
}

interface NetworkLinkData {
  source: string;
  target: string;
  strength: number;
  type: 'parent-child' | 'sibling';
}

// Camera Controller for smooth auto-zoom animation
const CameraController: React.FC<{
  targetPosition: THREE.Vector3 | null;
  targetLookAt: THREE.Vector3 | null;
  onComplete: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>;
}> = ({ targetPosition, targetLookAt, onComplete, controlsRef }) => {
  const { camera } = useThree();
  const animating = useRef(false);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (targetPosition && targetLookAt && controlsRef.current) {
      animating.current = true;
      progress.current += delta * 1.5; // Animation speed
      
      // Smooth lerp for camera position
      camera.position.lerp(targetPosition, 0.05);
      
      // Smooth lerp for controls target (look at point)
      controlsRef.current.target.lerp(targetLookAt, 0.05);
      controlsRef.current.update();
      
      // Check if animation is complete
      if (camera.position.distanceTo(targetPosition) < 0.1) {
        animating.current = false;
        progress.current = 0;
        onComplete();
      }
    }
  });

  return null;
};

// Scene component with all 3D elements
const NetworkScene: React.FC<{
  nodes: NetworkNodeData[];
  links: NetworkLinkData[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  onNodeClick: (node: NetworkNodeData) => void;
  onNodeHover: (nodeId: string | null) => void;
  mousePosition: { x: number; y: number };
  showParticles: boolean;
  cameraTarget: THREE.Vector3 | null;
  lookAtTarget: THREE.Vector3 | null;
  onAnimationComplete: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>;
  autoRotate: boolean;
}> = ({
  nodes,
  links,
  selectedNodeId,
  hoveredNodeId,
  onNodeClick,
  onNodeHover,
  mousePosition,
  showParticles,
  cameraTarget,
  lookAtTarget,
  onAnimationComplete,
  controlsRef,
  autoRotate,
}) => {
  const highlightedLinks = useMemo(() => {
    if (!hoveredNodeId && !selectedNodeId) return new Set<string>();
    const nodeId = hoveredNodeId || selectedNodeId;
    return new Set(
      links
        .filter(l => l.source === nodeId || l.target === nodeId)
        .map(l => `${l.source}-${l.target}`)
    );
  }, [links, hoveredNodeId, selectedNodeId]);

  return (
    <>
      {/* Camera Controller for auto-zoom */}
      <CameraController
        targetPosition={cameraTarget}
        targetLookAt={lookAtTarget}
        onComplete={onAnimationComplete}
        controlsRef={controlsRef}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[-10, -10, -5]} intensity={0.3} color="#8b5cf6" />
      <pointLight position={[10, -10, 5]} intensity={0.3} color="#06b6d4" />

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Particle background */}
      {showParticles && <ParticleBackground count={150} mousePosition={mousePosition} />}

      {/* Connections */}
      {links.map((link) => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        if (!sourceNode || !targetNode) return null;

        return (
          <NetworkConnection
            key={`${link.source}-${link.target}`}
            start={sourceNode.position}
            end={targetNode.position}
            strength={link.strength}
            isHighlighted={highlightedLinks.has(`${link.source}-${link.target}`)}
            type={link.type}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => (
        <NetworkNode
          key={node.id}
          position={node.position}
          name={node.name}
          type={node.type}
          userCount={node.userCount}
          monthlyVolume={node.monthlyVolume}
          isSelected={node.id === selectedNodeId}
          isHighlighted={
            hoveredNodeId === node.id ||
            links.some(l => 
              (l.source === hoveredNodeId || l.target === hoveredNodeId) &&
              (l.source === node.id || l.target === node.id)
            )
          }
          onClick={() => onNodeClick(node)}
          onHover={(hover) => onNodeHover(hover ? node.id : null)}
        />
      ))}

      {/* Camera controls */}
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
      />
    </>
  );
};

export const CompanyNetworkMap: React.FC<CompanyNetworkMapProps> = ({
  companies,
  onSelectCompany,
  onEditCompany
}) => {
  const [selectedNode, setSelectedNode] = useState<NetworkNodeData | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showParticles, setShowParticles] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'headquarters' | 'branch'>('all');
  const [minUsers, setMinUsers] = useState(0);
  
  // Camera animation state
  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3 | null>(null);
  const [lookAtTarget, setLookAtTarget] = useState<THREE.Vector3 | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  // Default camera position
  const defaultCameraPos = useMemo(() => new THREE.Vector3(0, 5, 15), []);
  const defaultLookAt = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  // Handle mouse movement for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Transform companies to network data with force-directed positions
  const { nodes, links } = useMemo(() => {
    const networkNodes: NetworkNodeData[] = [];
    const networkLinks: NetworkLinkData[] = [];
    
    // Filter companies
    const filteredCompanies = companies.filter(c => {
      if (filterType === 'headquarters' && !c.is_headquarters) return false;
      if (filterType === 'branch' && c.is_headquarters) return false;
      if ((c.userCount || 0) < minUsers) return false;
      return true;
    });

    // Create nodes with initial positions
    const headquarters = filteredCompanies.filter(c => c.is_headquarters);
    const branches = filteredCompanies.filter(c => !c.is_headquarters);

    // Position headquarters in a circle
    headquarters.forEach((company, index) => {
      const angle = (index / headquarters.length) * Math.PI * 2;
      const radius = 5;
      networkNodes.push({
        id: company.id,
        name: company.name,
        tradingName: company.trading_name,
        type: 'headquarters',
        position: [
          Math.cos(angle) * radius,
          Math.sin(angle) * 0.5,
          Math.sin(angle) * radius
        ],
        userCount: company.userCount || Math.floor(Math.random() * 10) + 1,
        monthlyVolume: Math.floor(Math.random() * 500000) + 50000,
        createdAt: company.created_at
      });
    });

    // Position branches around their parent headquarters
    branches.forEach((company, index) => {
      const parent = headquarters.find(h => h.id === company.parent_company_id);
      const parentNode = networkNodes.find(n => n.id === company.parent_company_id);
      
      let position: [number, number, number];
      
      if (parentNode) {
        // Position around parent
        const siblingCount = branches.filter(b => b.parent_company_id === company.parent_company_id).length;
        const siblingIndex = branches.filter(b => 
          b.parent_company_id === company.parent_company_id
        ).indexOf(company);
        const angle = (siblingIndex / siblingCount) * Math.PI * 2;
        const radius = 3;
        
        position = [
          parentNode.position[0] + Math.cos(angle) * radius,
          parentNode.position[1] - 1 + Math.random() * 0.5,
          parentNode.position[2] + Math.sin(angle) * radius
        ];

        // Create link to parent
        networkLinks.push({
          source: company.parent_company_id!,
          target: company.id,
          strength: 0.8,
          type: 'parent-child'
        });
      } else {
        // Orphan branch - position randomly
        const angle = (index / branches.length) * Math.PI * 2;
        const radius = 8;
        position = [
          Math.cos(angle) * radius,
          -2 + Math.random(),
          Math.sin(angle) * radius
        ];
      }

      networkNodes.push({
        id: company.id,
        name: company.name,
        tradingName: company.trading_name,
        type: 'branch',
        position,
        userCount: company.userCount || Math.floor(Math.random() * 5) + 1,
        monthlyVolume: Math.floor(Math.random() * 200000) + 20000,
        parentId: company.parent_company_id || undefined,
        createdAt: company.created_at
      });
    });

    return { nodes: networkNodes, links: networkLinks };
  }, [companies, filterType, minUsers]);

  // Focus camera on selected node
  const focusOnNode = useCallback((node: NetworkNodeData) => {
    const nodePos = new THREE.Vector3(...node.position);
    const cameraOffset = new THREE.Vector3(0, 3, 8);
    const newCameraPos = nodePos.clone().add(cameraOffset);
    
    setIsAnimating(true);
    setCameraTarget(newCameraPos);
    setLookAtTarget(nodePos);
  }, []);

  const handleNodeClick = useCallback((node: NetworkNodeData) => {
    setSelectedNode(node);
    focusOnNode(node);
    
    const company = companies.find(c => c.id === node.id);
    if (company && onSelectCompany) {
      onSelectCompany(company);
    }
  }, [companies, onSelectCompany, focusOnNode]);

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false);
    setCameraTarget(null);
    setLookAtTarget(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleViewDetails = useCallback((id: string) => {
    if (process.env.NODE_ENV !== 'production') console.log('View details:', id);
  }, []);

  const handleEdit = useCallback((id: string) => {
    if (onEditCompany) {
      onEditCompany(id);
    }
  }, [onEditCompany]);

  const resetView = useCallback(() => {
    setSelectedNode(null);
    setHoveredNodeId(null);
    setIsAnimating(true);
    setCameraTarget(defaultCameraPos);
    setLookAtTarget(defaultLookAt);
  }, [defaultCameraPos, defaultLookAt]);

  const panelCompany = selectedNode ? {
    id: selectedNode.id,
    name: selectedNode.name,
    tradingName: selectedNode.tradingName,
    type: selectedNode.type,
    userCount: selectedNode.userCount,
    monthlyVolume: selectedNode.monthlyVolume,
    createdAt: selectedNode.createdAt,
    parentName: selectedNode.parentId 
      ? nodes.find(n => n.id === selectedNode.parentId)?.name 
      : undefined,
    childrenCount: links.filter(l => l.source === selectedNode.id).length
  } : null;

  const stats = useMemo(() => ({
    total: nodes.length,
    headquarters: nodes.filter(n => n.type === 'headquarters').length,
    branches: nodes.filter(n => n.type === 'branch').length,
    connections: links.length
  }), [nodes, links]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'h-[600px]'} rounded-xl overflow-hidden`}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      
      {/* Mesh pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Header with controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background/20 backdrop-blur-xl border border-white/10"
        >
          <GitBranch className="h-5 w-5 text-primary" />
          <span className="font-medium text-white">Mapa de Empresas</span>
        </motion.div>

        {/* Stats badges */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2"
        >
          <Badge variant="outline" className="bg-background/20 backdrop-blur-xl border-white/10 text-white">
            <Building2 className="h-3 w-3 mr-1" />
            {stats.total} empresas
          </Badge>
          <Badge variant="outline" className="bg-primary/20 backdrop-blur-xl border-primary/30 text-primary">
            {stats.headquarters} matrizes
          </Badge>
          <Badge variant="outline" className="bg-cyan-500/20 backdrop-blur-xl border-cyan-500/30 text-cyan-400">
            {stats.branches} filiais
          </Badge>
        </motion.div>
      </div>

      {/* Control buttons */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-background/20 backdrop-blur-xl border-white/10 text-white hover:bg-background/30"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Tipo de Empresa</Label>
                <div className="flex gap-2 mt-2">
                  {['all', 'headquarters', 'branch'].map((type) => (
                    <Button
                      key={type}
                      variant={filterType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterType(type as typeof filterType)}
                    >
                      {type === 'all' ? 'Todas' : type === 'headquarters' ? 'Matrizes' : 'Filiais'}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Mínimo de Usuários: {minUsers}</Label>
                <Slider
                  value={[minUsers]}
                  onValueChange={([val]) => setMinUsers(val)}
                  max={20}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Partículas</Label>
                <Switch
                  checked={showParticles}
                  onCheckedChange={setShowParticles}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {selectedNode && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => focusOnNode(selectedNode)}
            className="bg-primary/20 backdrop-blur-xl border-primary/30 text-primary hover:bg-primary/30"
            title="Focar no nó selecionado"
          >
            <Focus className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={resetView}
          className="bg-background/20 backdrop-blur-xl border-white/10 text-white hover:bg-background/30"
          title="Resetar vista"
          aria-label="Redefinir visualização"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="bg-background/20 backdrop-blur-xl border-white/10 text-white hover:bg-background/30"
          aria-label="Ajustar ao tamanho"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 left-4 z-10"
      >
        <div className="px-3 py-2 rounded-lg bg-background/20 backdrop-blur-xl border border-white/10 text-xs text-white/60">
          🖱️ Arraste para rotacionar • Scroll para zoom • Clique em um nó para detalhes
        </div>
      </motion.div>

      {/* 3D Canvas */}
      <ErrorBoundary level="component" fallback={<NetworkMapFallback />}>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 5, 15], fov: 60 }}
          style={{ background: 'transparent' }}
          gl={{
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false
          }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              console.warn('[3D] WebGL context lost');
            });
          }}
        >
          <Suspense fallback={null}>
            <NetworkScene
              nodes={nodes}
              links={links}
              selectedNodeId={selectedNode?.id || null}
              hoveredNodeId={hoveredNodeId}
              onNodeClick={handleNodeClick}
              onNodeHover={setHoveredNodeId}
              mousePosition={mousePosition}
              showParticles={showParticles}
              cameraTarget={cameraTarget}
              lookAtTarget={lookAtTarget}
              onAnimationComplete={handleAnimationComplete}
              controlsRef={controlsRef}
              autoRotate={!selectedNode && !hoveredNodeId && !isAnimating}
            />
          </Suspense>
        </Canvas>
      </ErrorBoundary>

      {/* Glassmorphism detail panel */}
      <GlassmorphismPanel
        company={panelCompany}
        isOpen={!!selectedNode}
        onClose={handleClosePanel}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
      />
    </motion.div>
  );
};

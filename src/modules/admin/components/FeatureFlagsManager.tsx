'use client';

import { useState, useEffect } from "react";
import {
  Flag, 
  Plus, 
  Trash2, 
  Edit2, 
  Check,
  X,
  Percent,
  Building2,
  Search
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout_percentage: number;
  tenant_ids: string[];
  created_at: string;
}

interface FeatureFlagsManagerProps {
  companyOptions?: { id: string; name: string }[];
}


export function FeatureFlagsManager({ companyOptions = [] }: FeatureFlagsManagerProps) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  
  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formEnabled, setFormEnabled] = useState(false);
  const [formRollout, setFormRollout] = useState(100);
  
  const filteredFlags = flags.filter(flag => 
    flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flag.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleFlag = (flagId: string) => {
    setFlags(prev => prev.map(flag => 
      flag.id === flagId ? { ...flag, enabled: !flag.enabled } : flag
    ));
    toast.success('Feature flag atualizada');
  };

  const handleCreateFlag = () => {
    if (!formName.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    const newFlag: FeatureFlag = {
      id: Date.now().toString(),
      name: formName.toLowerCase().replace(/\s+/g, '_'),
      description: formDescription,
      enabled: formEnabled,
      rollout_percentage: formRollout,
      tenant_ids: [],
      created_at: new Date().toISOString(),
    };

    setFlags(prev => [...prev, newFlag]);
    resetForm();
    setIsCreateDialogOpen(false);
    toast.success('Feature flag criada com sucesso');
  };

  const handleUpdateFlag = () => {
    if (!editingFlag || !formName.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setFlags(prev => prev.map(flag => 
      flag.id === editingFlag.id 
        ? {
            ...flag,
            name: formName.toLowerCase().replace(/\s+/g, '_'),
            description: formDescription,
            enabled: formEnabled,
            rollout_percentage: formRollout,
          }
        : flag
    ));

    resetForm();
    setEditingFlag(null);
    toast.success('Feature flag atualizada com sucesso');
  };

  const handleDeleteFlag = (flagId: string) => {
    setFlags(prev => prev.filter(flag => flag.id !== flagId));
    toast.success('Feature flag removida');
  };

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormEnabled(false);
    setFormRollout(100);
  };

  const openEditDialog = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setFormName(flag.name);
    setFormDescription(flag.description);
    setFormEnabled(flag.enabled);
    setFormRollout(flag.rollout_percentage);
  };

  return (
    <div className="animate-fade-in">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-brand" />
                Feature Flags
              </CardTitle>
              <CardDescription>
                Controle de funcionalidades e rollout gradual
              </CardDescription>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand hover:bg-brand/90 text-brand-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Flag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Feature Flag</DialogTitle>
                  <DialogDescription>
                    Crie uma nova flag para controlar funcionalidades
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome</label>
                    <Input
                      placeholder="ex: new_dashboard"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea
                      placeholder="Descreva a funcionalidade..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Habilitada</label>
                    <Switch
                      checked={formEnabled}
                      onCheckedChange={setFormEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Rollout</label>
                      <span className="text-sm text-muted-foreground">{formRollout}%</span>
                    </div>
                    <Slider
                      value={[formRollout]}
                      onValueChange={([value]) => setFormRollout(value)}
                      max={100}
                      step={5}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateFlag} className="bg-brand hover:bg-brand/90">
                    Criar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar flags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredFlags.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Flag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma feature flag encontrada</p>
              </div>
            ) : (
              filteredFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                          {flag.name}
                        </code>
                        {flag.enabled ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            <Check className="h-3 w-3 mr-1" />
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <X className="h-3 w-3 mr-1" />
                            Inativa
                          </Badge>
                        )}
                        {flag.rollout_percentage < 100 && flag.rollout_percentage > 0 && (
                          <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            <Percent className="h-3 w-3 mr-1" />
                            {flag.rollout_percentage}%
                          </Badge>
                        )}
                        {flag.tenant_ids.length > 0 && (
                          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            <Building2 className="h-3 w-3 mr-1" />
                            {flag.tenant_ids.length} tenants
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {flag.description || 'Sem descrição'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={flag.enabled}
                        onCheckedChange={() => handleToggleFlag(flag.id)}
                      />
                      
                      <Dialog open={editingFlag?.id === flag.id} onOpenChange={(open) => !open && setEditingFlag(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(flag)}
                            aria-label="Editar feature flag"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Feature Flag</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Nome</label>
                              <Input
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Descrição</label>
                              <Textarea
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Habilitada</label>
                              <Switch
                                checked={formEnabled}
                                onCheckedChange={setFormEnabled}
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Rollout</label>
                                <span className="text-sm text-muted-foreground">{formRollout}%</span>
                              </div>
                              <Slider
                                value={[formRollout]}
                                onValueChange={([value]) => setFormRollout(value)}
                                max={100}
                                step={5}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingFlag(null)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleUpdateFlag} className="bg-brand hover:bg-brand/90">
                              Salvar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Remover feature flag">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Feature Flag?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. A flag <code className="bg-muted px-1 rounded">{flag.name}</code> será removida permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteFlag(flag.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

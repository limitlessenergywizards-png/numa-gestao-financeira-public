'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FluidModal, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  BottomSheet,
  SheetHeader,
  SheetAction,
  useFluidModal,
  useBottomSheet,
  useFluidToast,
} from '@/components/overlays';
import { 
  Layers, 
  MessageSquare, 
  Bell, 
  CheckCircle, 
  XCircle, 
  Info, 
  AlertTriangle,
  Trash2,
  Edit,
  Share2,
  Download,
} from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export const FluidComponentsDemo = () => {
  const { showToast } = useFluidToast();
  
  // Modal states
  const [modalSize, setModalSize] = useState<ModalSize>('md');
  const modal = useFluidModal();
  
  // BottomSheet state
  const [sheetSnapPoints, setSheetSnapPoints] = useState<number[]>([0.5, 0.9]);
  const sheet = useBottomSheet();

  const openModalWithSize = (size: ModalSize) => {
    setModalSize(size);
    modal.open();
  };

  const openSheetWithSnaps = (snaps: number[]) => {
    setSheetSnapPoints(snaps);
    sheet.open();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
          <Layers className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Componentes Fluidos</h2>
          <p className="text-sm text-muted-foreground">
            Demonstração interativa de modais, sheets e toasts com animações spring
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* FluidModal Section */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              FluidModal
            </CardTitle>
            <CardDescription>
              Modal com animações spring, backdrop blur e suporte a ESC
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Tamanhos disponíveis:</p>
            <div className="flex flex-wrap gap-2">
              {(['sm', 'md', 'lg', 'xl'] as ModalSize[]).map((size) => (
                <Button
                  key={size}
                  variant="outline"
                  size="sm"
                  onClick={() => openModalWithSize(size)}
                  className="uppercase"
                >
                  {size}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* BottomSheet Section */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-purple-500" />
              BottomSheet
            </CardTitle>
            <CardDescription>
              Sheet mobile-first com gestos de arraste e snap points
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Configurações de snap:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openSheetWithSnaps([0.4])}
              >
                40%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openSheetWithSnaps([0.5, 0.9])}
              >
                50% / 90%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openSheetWithSnaps([0.3, 0.6, 0.9])}
              >
                30% / 60% / 90%
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FluidToast Section */}
        <Card className="border-border/50 md:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-amber-500" />
              FluidToast
            </CardTitle>
            <CardDescription>
              Sistema de notificações com layout animations e auto-dismiss
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Tipos de toast:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => showToast.success('Operação realizada!', 'Os dados foram salvos com sucesso.')}
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Success
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => showToast.error('Falha na operação', 'Não foi possível completar a ação.')}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Error
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => showToast.info('Informação', 'Sua sessão expira em 5 minutos.')}
                className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950"
              >
                <Info className="h-4 w-4 mr-2" />
                Info
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => showToast.warning('Atenção', 'Esta ação não pode ser desfeita.')}
                className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-900 dark:hover:bg-amber-950"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Warning
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FluidModal Instance */}
      <FluidModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        size={modalSize}
      >
        <ModalHeader 
          title={`Modal ${modalSize.toUpperCase()}`}
          description="Este é um exemplo de FluidModal com animações spring e backdrop blur."
        />
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O FluidModal oferece uma experiência premium com:
            </p>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Animações spring physics a 60fps
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Backdrop blur progressivo
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Fechamento por ESC e clique no backdrop
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Focus trap e restauração de foco
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Respeita prefers-reduced-motion
              </li>
            </ul>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={modal.close}>
            Cancelar
          </Button>
          <Button onClick={modal.close}>
            Confirmar
          </Button>
        </ModalFooter>
      </FluidModal>

      {/* BottomSheet Instance */}
      <BottomSheet
        isOpen={sheet.isOpen}
        onClose={sheet.close}
        snapPoints={sheetSnapPoints}
      >
        <SheetHeader 
          title="Ações Rápidas"
          description="Selecione uma ação para executar"
        />
        <div className="mt-4 space-y-1">
          <SheetAction 
            icon={<Edit className="h-5 w-5" />}
            onClick={() => {
              sheet.close();
              showToast.info('Editar', 'Abrindo modo de edição...');
            }}
          >
            Editar item
          </SheetAction>
          <SheetAction 
            icon={<Share2 className="h-5 w-5" />}
            onClick={() => {
              sheet.close();
              showToast.success('Compartilhado!', 'Link copiado para a área de transferência.');
            }}
          >
            Compartilhar
          </SheetAction>
          <SheetAction 
            icon={<Download className="h-5 w-5" />}
            onClick={() => {
              sheet.close();
              showToast.info('Download', 'Preparando arquivo...');
            }}
          >
            Baixar arquivo
          </SheetAction>
          <SheetAction 
            icon={<Trash2 className="h-5 w-5" />}
            variant="destructive"
            onClick={() => {
              sheet.close();
              showToast.warning('Atenção', 'Item movido para a lixeira.');
            }}
          >
            Excluir
          </SheetAction>
        </div>
      </BottomSheet>
    </div>
  );
};

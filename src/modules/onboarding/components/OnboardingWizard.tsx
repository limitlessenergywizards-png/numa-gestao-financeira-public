'use client';

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepIndicator } from "./StepIndicator";
import { StepSegment } from "./StepSegment";
import { StepBankAccounts } from "./StepBankAccounts";
import { ChartTemplateChoice } from "./ChartTemplateChoice";
import { StepCategories } from "./StepCategories";
import { StepFirstTransaction } from "./StepFirstTransaction";
import { StepInviteUsers } from "./StepInviteUsers";
import { OnboardingComplete } from "./OnboardingComplete";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Upload,
  Loader2,
  Check,
  AlertCircle,
  SkipForward
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { maskCNPJ, maskCEP, maskPhone, isValidCNPJ } from "@/lib/masks";
import { fetchCNPJData } from "@/lib/apiValidations";
import { useTrialStatus } from "@/modules/subscription/hooks/useTrialStatus";
import { MAIN_ROUTES } from "@/lib/routes";
import { seedChartOfAccounts } from "@/modules/finance/ledger/services/chartOfAccountsService";
import { useOnboardingSubmit } from "../hooks/useOnboardingSubmit";

interface BankAccountData {
  id: string; // Temporary ID for UI
  name: string;
  bank_name: string;
  initial_balance: string;
}

interface CategoryData {
  id: string;
  name: string;
  color: string;
  type: "receita" | "despesa";
}

interface InviteEntry {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer";
}

interface TransactionData {
  type: "entrada" | "saida";
  amount: string;
  description: string;
  category_name: string;
  bank_account_name: string;
  date: string;
}

interface FormData {
  name: string;
  trading_name: string;
  document: string;
  email: string;
  phone: string;
  mobile_phone: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  logo_file: File | null;
  logo_preview: string | null;
  segment: string;
}

const initialFormData: FormData = {
  name: "",
  trading_name: "",
  document: "",
  email: "",
  phone: "",
  mobile_phone: "",
  address: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  zip_code: "",
  logo_file: null,
  logo_preview: null,
  segment: "",
};

const initialTransactionData: TransactionData = {
  type: "entrada",
  amount: "0,00",
  description: "",
  category_name: "",
  bank_account_name: "",
  date: new Date().toISOString().split("T")[0],
};

const steps = [
  { number: 1, title: "Segmento" },
  { number: 2, title: "Empresa" },
  { number: 3, title: "Contas" },
  { number: 4, title: "Plano de Contas" },
  { number: 5, title: "Categorias" },
  { number: 6, title: "Lançamento" },
  { number: 7, title: "Equipe" },
];

export function OnboardingWizard() {
  const { user } = useAuth();
  const { refreshCompanies, companies } = useCompany(); // Get existing companies
  const router = useRouter();
  const trialStatus = useTrialStatus();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [bankAccounts, setBankAccounts] = useState<BankAccountData[]>([
    { id: "1", name: "", bank_name: "", initial_balance: "0,00" },
  ]);
  const [chartTemplateChoice, setChartTemplateChoice] = useState<string>("padrao");
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [invites, setInvites] = useState<InviteEntry[]>([]);
  const [transactionData, setTransactionData] = useState<TransactionData>(initialTransactionData);
  const { submitOnboarding, isLoading } = useOnboardingSubmit();
  const [isComplete, setIsComplete] = useState(false);
  const [isValidatingCNPJ, setIsValidatingCNPJ] = useState(false);
  const [cnpjValid, setCnpjValid] = useState<boolean | null>(null);

  // Track skipped steps
  const [skippedSteps, setSkippedSteps] = useState<number[]>([]);

  const validateCNPJ = useCallback(async (cnpj: string) => {
    if (!isValidCNPJ(cnpj)) {
      setCnpjValid(false);
      return;
    }

    setIsValidatingCNPJ(true);
    try {
      const data = await fetchCNPJData(cnpj);
      if (data) {
        setFormData((prev) => ({
          ...prev,
          name: data.razao_social || prev.name,
          trading_name: data.nome_fantasia || prev.trading_name,
          email: data.email || prev.email,
          phone: data.telefone1 ? maskPhone(data.telefone1) : prev.phone,
          address: data.logradouro || prev.address,
          number: data.numero || prev.number,
          complement: data.complemento || prev.complement,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.municipio || prev.city,
          state: data.uf || prev.state,
          zip_code: data.cep ? maskCEP(data.cep) : prev.zip_code,
        }));
        setCnpjValid(true);
        toast.success("Dados do CNPJ carregados!");
      } else {
        setCnpjValid(false);
      }
    } catch (error) {
      console.error('[Onboarding] CNPJ validation failed:', error);
      setCnpjValid(false);
    } finally {
      setIsValidatingCNPJ(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (field: keyof FormData, value: string) => {
      let maskedValue = value;

      if (field === "document") {
        maskedValue = maskCNPJ(value);
      } else if (field === "zip_code") {
        maskedValue = maskCEP(value);
      } else if (field === "phone" || field === "mobile_phone") {
        maskedValue = maskPhone(value);
      }

      setFormData((prev) => ({ ...prev, [field]: maskedValue }));

      // Validate CNPJ when complete
      if (field === "document" && maskedValue.length === 18) {
        validateCNPJ(maskedValue);
      }
    },
    [validateCNPJ]
  );

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 2MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, selecione uma imagem");
        return;
      }
      const preview = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, logo_file: file, logo_preview: preview }));
    }
  };

  const getStepStatus = (step: number) => {
    if (step === 3 && bankAccounts.length === 0) return 'empty';
    if (step === 3 && bankAccounts.some(a => !a.name || !a.bank_name)) return 'invalid';

    if (step === 4) {
      // Chart template choice is always valid (default or empty)
      return 'valid';
    }

    if (step === 5) {
      const receitas = categories.filter(c => c.type === 'receita').length;
      const despesas = categories.filter(c => c.type === 'despesa').length;
      if (receitas < 1 || despesas < 1) return 'warning';
    }

    return 'valid';
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.segment.length > 0;
    }
    if (currentStep === 2) {
      return formData.name.trim().length > 0;
    }
    if (currentStep === 3) {
      // Allow proceeding if skipped or valid
      if (skippedSteps.includes(3)) return true;
      const validAccounts = bankAccounts.filter(
        (a) => a.name.trim().length > 0 && a.bank_name.length > 0
      );
      return validAccounts.length >= 1;
    }
    if (currentStep === 4) {
      // Chart template choice always has a valid selection
      return true;
    }
    if (currentStep === 5) {
      if (skippedSteps.includes(5)) return true;
      const receitas = categories.filter((c) => c.type === "receita");
      const despesas = categories.filter((c) => c.type === "despesa");
      return receitas.length >= 1 && despesas.length >= 1;
    }
    if (currentStep === 6) {
      if (skippedSteps.includes(6)) return true;

      const amount = parseFloat(
        transactionData.amount.replace(/\./g, "").replace(",", ".")
      );
      return (
        amount > 0 &&
        transactionData.description.trim().length > 0 &&
        transactionData.category_name.length > 0 &&
        transactionData.bank_account_name.length > 0
      );
    }
    if (currentStep === 7) {
      // Invites are always optional - can proceed with 0
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < 7) {
      // Remove current step from skipped if user is manually proceeding
      if (skippedSteps.includes(currentStep)) {
        setSkippedSteps(prev => prev.filter(s => s !== currentStep));
      }
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else if (currentStep === 1 && companies.length > 0) {
      router.push(MAIN_ROUTES.HOME);
    }
  };

  const handleSkip = () => {
    if (currentStep >= 3 && currentStep <= 7) {
      if (!skippedSteps.includes(currentStep)) {
        setSkippedSteps(prev => [...prev, currentStep]);
      }

      if (currentStep < 7) {
        setCurrentStep(prev => prev + 1);
      } else {
        // If skipping last step, submit
        handleSubmit(true);
      }
    }
  };

  const handleSubmit = async (skipLastStep = false) => {
    console.log('[WIZARD] handleSubmit called, user:', user?.id, 'skipLastStep:', skipLastStep);
    if (!user) {
      console.error('[WIZARD] ABORT: user is null!');
      return;
    }

    // VALIDATION: Check Trial Limits
    if (trialStatus.isOnTrial && !trialStatus.hasActiveSubscription) {
      if (companies.length >= 3) {
        toast.error("Limite de 3 empresas atingido no período de teste.");
        return;
      }
    }

    // VALIDATION: Check Duplicate Companies
    const isDuplicate = companies.some(
      (c) => c.name.toLowerCase().trim() === formData.name.toLowerCase().trim()
    );
    if (isDuplicate) {
      console.error('[WIZARD] ABORT: duplicate company name:', formData.name);
      toast.error("Você já possui uma empresa cadastrada com este nome.");
      return;
    }

    console.log('[WIZARD] Calling submitOnboarding...');
    const success = await submitOnboarding({
      userId: user.id,
      userEmail: user.email,
      formData,
      bankAccounts,
      chartTemplateChoice,
      categories,
      transactionData,
      invites,
      skippedSteps,
      skipLastStep,
      seedChartFn: seedChartOfAccounts,
    });

    console.log('[WIZARD] submitOnboarding returned:', success);
    if (success) {
      setIsComplete(true);
      setTimeout(async () => {
        await refreshCompanies();
        router.replace(MAIN_ROUTES.HOME);
      }, 2000);
    }
  };

  const renderStep = () => {
    if (isComplete) {
      return (
        <OnboardingComplete
          companyName={formData.trading_name || formData.name}
          onGoToDashboard={() => router.replace(MAIN_ROUTES.HOME)}
        />
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <StepSegment
            value={formData.segment}
            onChange={(segment) => setFormData((prev) => ({ ...prev, segment }))}
          />
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Dados da Empresa</h2>
              <p className="text-sm text-muted-foreground">
                Preencha o CNPJ para carregar automaticamente
              </p>
            </div>

            <div className="space-y-4">
              {/* CNPJ */}
              <div className="space-y-2">
                <Label htmlFor="document">CNPJ</Label>
                <div className="relative">
                  <Input
                    id="document"
                    value={formData.document}
                    onChange={(e) => handleInputChange("document", e.target.value)}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className="pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValidatingCNPJ && (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                    {!isValidatingCNPJ && cnpjValid === true && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                    {!isValidatingCNPJ && cnpjValid === false && (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                </div>
              </div>

              {/* Razão Social */}
              <div className="space-y-2">
                <Label htmlFor="name">Razão Social *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Nome da empresa"
                  required
                />
              </div>

              {/* Nome Fantasia */}
              <div className="space-y-2">
                <Label htmlFor="trading_name">Nome Fantasia</Label>
                <Input
                  id="trading_name"
                  value={formData.trading_name}
                  onChange={(e) => handleInputChange("trading_name", e.target.value)}
                  placeholder="Nome comercial"
                />
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo da Empresa</Label>
                <div className="flex items-center gap-4">
                  {formData.logo_preview ? (
                    <img
                      src={formData.logo_preview}
                      alt="Logo preview"
                      className="w-16 h-16 rounded-lg object-cover border border-border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center border border-dashed border-border">
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <label className="flex-1">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formData.logo_file ? "Trocar imagem" : "Enviar logo"}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <StepBankAccounts
            accounts={bankAccounts}
            onChange={setBankAccounts}
          />
        );

      case 4:
        return (
          <ChartTemplateChoice
            value={chartTemplateChoice}
            onChange={setChartTemplateChoice}
            currentSegment={formData.segment}
          />
        );

      case 5:
        return (
          <StepCategories
            segment={formData.segment}
            categories={categories}
            onChange={setCategories}
          />
        );

      case 6:
        return (
          <StepFirstTransaction
            bankAccounts={bankAccounts}
            categories={categories}
            transaction={transactionData}
            onChange={setTransactionData}
          />
        );

      case 7:
        return (
          <StepInviteUsers
            invites={invites}
            onChange={setInvites}
          />
        );
    }
  };

  const isSkippable = currentStep >= 3;

  return (
    <div className="min-h-[100dvh] flex items-start md:items-center justify-center p-4 pb-24 md:pb-8 overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 max-w-2xl w-full"
      >
        <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-3xl p-6 md:p-8 shadow-2xl">
          {/* Step Indicator */}
          {!isComplete && (
            <div className="mb-8">
              <StepIndicator steps={steps} currentStep={currentStep} />
            </div>
          )}

          {/* Form Content */}
          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

          {/* Navigation */}
          {!isComplete && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1 && companies.length === 0 || isLoading}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {currentStep === 1 ? "Sair" : "Voltar"}
              </Button>

              <div className="flex items-center gap-2">
                {isSkippable && (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    disabled={isLoading}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Pular
                    <SkipForward className="w-4 h-4 ml-1" />
                  </Button>
                )}

                {currentStep < 7 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="gap-2"
                  >
                    Próximo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSubmit(false)}
                    disabled={isLoading || !canProceed()}
                    className="gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Finalizar Cadastro
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

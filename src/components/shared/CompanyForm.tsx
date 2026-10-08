'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCompanySubmit } from "@/modules/iam/companies/hooks/useCompanyForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Check, X, Upload, Building2 } from "lucide-react";
import { maskCNPJ, maskCEP, maskPhone, isValidCNPJ, isValidEmail } from "@/lib/masks";
import { fetchCNPJData, fetchCEPData } from "@/lib/apiValidations";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errorUtils";

const currencies = [
  { code: "BRL", symbol: "R$", name: "Real Brasileiro" },
  { code: "USD", symbol: "$", name: "Dólar Americano" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "Libra Esterlina" },
];

const taxRegimes = [
  { value: "simples_nacional", label: "Simples Nacional" },
  { value: "lucro_presumido", label: "Lucro Presumido" },
  { value: "lucro_real", label: "Lucro Real" },
  { value: "mei", label: "MEI (Microempreendedor Individual)" },
];

interface CompanyFormData {
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
  currency: string;
  tax_regime: string;
  is_headquarters: boolean;
  logo_url: string | null;
}

interface Company {
  id: string;
  name: string;
  trading_name: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  mobile_phone?: string | null;
  address: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  currency: string;
  tax_regime?: string | null;
  is_headquarters: boolean;
  logo_url: string | null;
}

interface CompanyFormProps {
  company?: Company | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const defaultFormData: CompanyFormData = {
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
  currency: "BRL",
  tax_regime: "simples_nacional",
  is_headquarters: false,
  logo_url: null,
};

export function CompanyForm({ company, onSuccess, onCancel }: CompanyFormProps) {
  const { user } = useAuth();
  const { companies, refreshCompanies } = useCompany();
  
  const [formData, setFormData] = useState<CompanyFormData>(defaultFormData);
  const { submitCompany, isLoading } = useCompanySubmit();
  const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [cnpjValid, setCnpjValid] = useState<boolean | null>(null);
  const [cepValid, setCepValid] = useState<boolean | null>(null);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Initialize form with company data
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        trading_name: company.trading_name || "",
        document: company.document || "",
        email: company.email || "",
        phone: company.phone || "",
        mobile_phone: company.mobile_phone || "",
        address: company.address || "",
        number: company.number || "",
        complement: company.complement || "",
        neighborhood: company.neighborhood || "",
        city: company.city || "",
        state: company.state || "",
        zip_code: company.zip_code || "",
        currency: company.currency || "BRL",
        tax_regime: company.tax_regime || "simples_nacional",
        is_headquarters: company.is_headquarters || false,
        logo_url: company.logo_url || null,
      });
      if (company.logo_url) {
        setLogoPreview(company.logo_url);
      }
    }
  }, [company]);

  // Debounced CNPJ validation
  const validateCNPJ = useDebouncedCallback(async (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length < 14) {
      setCnpjValid(null);
      return;
    }

    // First validate checksum
    if (!isValidCNPJ(cnpj)) {
      setCnpjValid(false);
      return;
    }

    setIsLoadingCNPJ(true);
    const data = await fetchCNPJData(cleanCNPJ);
    
    if (data) {
      setCnpjValid(true);
      // Auto-fill form fields
      setFormData(prev => ({
        ...prev,
        name: data.razao_social || prev.name,
        trading_name: data.nome_fantasia || prev.trading_name,
        email: data.email || prev.email,
        phone: data.telefone1 || prev.phone,
        zip_code: maskCEP(data.cep || ''),
        address: data.logradouro || prev.address,
        number: data.numero || prev.number,
        complement: data.complemento || prev.complement,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.municipio || prev.city,
        state: data.uf || prev.state,
      }));
      
      // Also validate email if auto-filled
      if (data.email) {
        setEmailValid(isValidEmail(data.email));
      }
      
      toast.success("Dados da empresa carregados automaticamente!");
    } else {
      setCnpjValid(false);
      toast.error("CNPJ não encontrado ou inválido");
    }
    
    setIsLoadingCNPJ(false);
  }, 800);

  // Debounced CEP validation
  const validateCEP = useDebouncedCallback(async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length < 8) {
      setCepValid(null);
      return;
    }

    setIsLoadingCEP(true);
    const data = await fetchCEPData(cleanCEP);
    
    if (data) {
      setCepValid(true);
      setFormData(prev => ({
        ...prev,
        address: data.logradouro || prev.address,
        complement: data.complemento || prev.complement,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
      toast.success("Endereço carregado automaticamente!");
    } else {
      setCepValid(false);
      toast.error("CEP não encontrado");
    }
    
    setIsLoadingCEP(false);
  }, 500);

  function handleInputChange(field: keyof CompanyFormData, value: string | boolean) {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Apply masks and validations
    if (field === 'document') {
      const masked = maskCNPJ(value as string);
      setFormData(prev => ({ ...prev, document: masked }));
      validateCNPJ(masked);
    } else if (field === 'zip_code') {
      const masked = maskCEP(value as string);
      setFormData(prev => ({ ...prev, zip_code: masked }));
      validateCEP(masked);
    } else if (field === 'phone' || field === 'mobile_phone') {
      const masked = maskPhone(value as string);
      setFormData(prev => ({ ...prev, [field]: masked }));
    } else if (field === 'email') {
      setEmailValid(isValidEmail(value as string));
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Selecione um arquivo de imagem válido");
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (formData.email && !isValidEmail(formData.email)) {
      toast.error("E-mail inválido");
      return;
    }

    const currencyData = currencies.find(c => c.code === formData.currency);
    const success = await submitCompany(
      formData,
      currencyData?.symbol || "R$",
      user.id,
      company || null,
      logoFile,
      companies.length,
      refreshCompanies
    );

    if (success) onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo Upload */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className={cn(
            "h-20 w-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors",
            "hover:border-primary/50 cursor-pointer",
            logoPreview ? "border-primary/30" : "border-muted-foreground/30"
          )}>
            {logoPreview ? (
              <img 
                src={logoPreview} 
                alt="Logo" 
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground/50" />
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
        <div>
          <Label className="text-sm font-medium">Logo da Empresa</Label>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG ou SVG. Máximo 2MB.
          </p>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
          >
            <Upload className="h-3 w-3 mr-2" />
            Carregar
          </Button>
        </div>
      </div>

      {/* CNPJ with validation */}
      <div className="space-y-2">
        <Label htmlFor="document">CNPJ</Label>
        <div className="relative">
          <Input
            id="document"
            value={formData.document}
            onChange={(e) => handleInputChange("document", e.target.value)}
            placeholder="00.000.000/0001-00"
            className={cn(
              "pr-10 transition-colors",
              cnpjValid === true && "border-green-500 focus-visible:ring-green-500",
              cnpjValid === false && "border-destructive focus-visible:ring-destructive"
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isLoadingCNPJ && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {!isLoadingCNPJ && cnpjValid === true && <Check className="h-4 w-4 text-green-500" />}
            {!isLoadingCNPJ && cnpjValid === false && <X className="h-4 w-4 text-destructive" />}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Digite o CNPJ para buscar dados automaticamente
        </p>
      </div>

      {/* Company Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="space-y-2">
          <Label htmlFor="trading_name">Nome Fantasia</Label>
          <Input
            id="trading_name"
            value={formData.trading_name}
            onChange={(e) => handleInputChange("trading_name", e.target.value)}
            placeholder="Nome fantasia"
          />
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="contato@empresa.com"
              className={cn(
                "pr-10 transition-colors",
                formData.email && emailValid === true && "border-green-500",
                formData.email && emailValid === false && "border-destructive"
              )}
            />
            {formData.email && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {emailValid === true && <Check className="h-4 w-4 text-green-500" />}
                {emailValid === false && <X className="h-4 w-4 text-destructive" />}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            placeholder="(00) 0000-0000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile_phone">Celular</Label>
          <Input
            id="mobile_phone"
            value={formData.mobile_phone}
            onChange={(e) => handleInputChange("mobile_phone", e.target.value)}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>


      {/* Address */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zip_code">CEP</Label>
          <div className="relative">
            <Input
              id="zip_code"
              value={formData.zip_code}
              onChange={(e) => handleInputChange("zip_code", e.target.value)}
              placeholder="00000-000"
              className={cn(
                "pr-10 transition-colors",
                cepValid === true && "border-green-500",
                cepValid === false && "border-destructive"
              )}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isLoadingCEP && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {!isLoadingCEP && cepValid === true && <Check className="h-4 w-4 text-green-500" />}
              {!isLoadingCEP && cepValid === false && <X className="h-4 w-4 text-destructive" />}
            </div>
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Logradouro</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            placeholder="Rua, Avenida..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="number">Número</Label>
          <Input
            id="number"
            value={formData.number}
            onChange={(e) => handleInputChange("number", e.target.value)}
            placeholder="123"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            value={formData.complement}
            onChange={(e) => handleInputChange("complement", e.target.value)}
            placeholder="Sala, Andar..."
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input
            id="neighborhood"
            value={formData.neighborhood}
            onChange={(e) => handleInputChange("neighborhood", e.target.value)}
            placeholder="Bairro"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange("city", e.target.value)}
            placeholder="Cidade"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => handleInputChange("state", e.target.value)}
            placeholder="UF"
            maxLength={2}
          />
        </div>
      </div>

      {/* Currency, Tax Regime and HQ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currency">Moeda</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => handleInputChange("currency", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a moeda" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.symbol} - {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax_regime">Regime Tributário</Label>
          <Select
            value={formData.tax_regime}
            onValueChange={(value) => handleInputChange("tax_regime", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o regime" />
            </SelectTrigger>
            <SelectContent>
              {taxRegimes.map((regime) => (
                <SelectItem key={regime.value} value={regime.value}>
                  {regime.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Switch
            id="is_headquarters"
            checked={formData.is_headquarters}
            onCheckedChange={(checked) => handleInputChange("is_headquarters", checked)}
          />
          <Label htmlFor="is_headquarters">Esta é a matriz</Label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar"
          )}
        </Button>
      </div>
    </form>
  );
}

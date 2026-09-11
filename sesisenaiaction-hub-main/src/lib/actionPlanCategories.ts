export const ACTION_PLAN_CATEGORIES = [
  { value: "infraestrutura", label: "Infraestrutura" },
  { value: "pedagogico", label: "Pedagógico" },
  { value: "qualidade", label: "Qualidade" },
  { value: "recursos_humanos", label: "Recursos Humanos" },
  { value: "manutencao", label: "Manutenção" },
  { value: "ti", label: "Tecnologia da Informação (TI)" },
] as const;

export const getActionPlanCategoryLabel = (value: string | null | undefined) =>
  ACTION_PLAN_CATEGORIES.find((category) => category.value === value)?.label || "Sem área definida";
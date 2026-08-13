export class AIProviderNotConfiguredError extends Error {
  constructor(message = "Nenhum provedor de IA configurado (defina AI_API_KEY no ambiente)") {
    super(message);
    this.name = "AIProviderNotConfiguredError";
  }
}

export class AIProviderRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProviderRequestError";
  }
}

export class AIResponseParseError extends Error {
  constructor(
    message: string,
    public rawResponse: string
  ) {
    super(message);
    this.name = "AIResponseParseError";
  }
}

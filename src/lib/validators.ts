const onlyDigits = (v: string) => v.replace(/\D/g, "");

/**
 * Valida um CPF pelo algoritmo oficial dos dígitos verificadores.
 * Pega erro de digitação (número trocado, incompleto) que a máscara
 * sozinha não percebe. CPFs com todos os dígitos iguais (111.111.111-11
 * etc.) são inválidos mesmo passando na conta.
 */
export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split("").map(Number);

  const calcDigito = (base: number[]) => {
    let soma = 0;
    let peso = base.length + 1;
    for (const n of base) {
      soma += n * peso;
      peso -= 1;
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const d1 = calcDigito(digits.slice(0, 9));
  if (d1 !== digits[9]) return false;

  const d2 = calcDigito(digits.slice(0, 10));
  if (d2 !== digits[10]) return false;

  return true;
}

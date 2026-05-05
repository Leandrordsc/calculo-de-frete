const baseCostsByRegion = {
  Sul: 10,
  Sudeste: 10,
  "Centro-Oeste": 15,
  Norte: 20,
  Nordeste: 20
};

const form = document.querySelector("#shipping-form");
const totalElement = document.querySelector("#total");
const baseCostElement = document.querySelector("#base-cost");
const weightCostElement = document.querySelector("#weight-cost");
const expressCostElement = document.querySelector("#express-cost");
const messageElement = document.querySelector("#message");

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function calculateShipping(weight, region, deliveryType) {
  const baseCost = baseCostsByRegion[region];
  const extraWeight = Math.max(0, weight - 5);
  const weightCost = extraWeight * 2;
  const subtotal = baseCost + weightCost;
  const expressCost = deliveryType === "expressa" ? subtotal * 0.5 : 0;
  const total = subtotal + expressCost;

  return {
    baseCost,
    extraWeight,
    weightCost,
    expressCost,
    total
  };
}

function updateSummary(result, region, deliveryType) {
  totalElement.textContent = formatCurrency(result.total);
  baseCostElement.textContent = formatCurrency(result.baseCost);
  weightCostElement.textContent = formatCurrency(result.weightCost);
  expressCostElement.textContent = formatCurrency(result.expressCost);

  const deliveryText = deliveryType === "expressa" ? "expressa" : "normal";
  messageElement.textContent =
    `Entrega ${deliveryText} para ${region}. ` +
    `Peso excedente: ${result.extraWeight.toFixed(1)} kg.`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const weight = Number(formData.get("weight"));
  const region = formData.get("region");
  const deliveryType = formData.get("deliveryType");

  if (!region || Number.isNaN(weight) || weight < 0) {
    messageElement.textContent = "Informe um peso valido e selecione uma regiao.";
    return;
  }

  const result = calculateShipping(weight, region, deliveryType);
  updateSummary(result, region, deliveryType);
});

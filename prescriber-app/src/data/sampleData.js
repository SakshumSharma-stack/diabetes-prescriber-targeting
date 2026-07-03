export const RECOMMENDATION_COPY = {
  Priority: (d) =>
    `Highly persuadable and a large gap — ${d.specialty} in ${d.state} is prescribing well below what the model expects for a panel this size. Prioritize an in-person visit this cycle.`,
  High: (d) =>
    `Strong opportunity with good responsiveness. A rep call or sample drop for this ${d.specialty} prescriber in ${d.state} should close meaningful gap quickly.`,
  Medium: (d) =>
    `Moderate opportunity. Worth a routine call or digital touchpoint, but weigh against higher-tier targets in ${d.state} first.`,
  Low: (d) =>
    `Limited upside — either the gap is small or this prescriber has shown low responsiveness historically. Deprioritize relative to other ${d.specialty} targets.`,
}

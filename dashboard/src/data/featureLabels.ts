/* Numele pe înțelesul oricui pentru variabilele modelului (bara derulantă).
 * kind: cum se afișează valoarea
 *   pct   = randament / variație / volatilitate / distanță față de maxim, ca procent
 *   z     = abatere standard față de media ultimului an (σ)
 *   rsi   = indicator RSI (0–100; peste 70 supracumpărat, sub 30 supravândut)
 *   num   = scor numeric
 */
export type FeatureKind = "pct" | "z" | "rsi" | "num";
export const FEATURE_LABELS: Record<string, { label: string; kind: FeatureKind }> = {
  EUROSTOXX_ret_5z: { label: "Euro Stoxx 50 · randament 5 zile", kind: "pct" },
  EUROSTOXX_ret_20z: { label: "Euro Stoxx 50 · randament o lună", kind: "pct" },
  STOXX600_drawdown_250z: { label: "Bursele europene (STOXX 600) · sub maximul anual", kind: "pct" },
  DAX_vol_20z: { label: "Bursa germană (DAX) · volatilitate o lună", kind: "pct" },
  NASDAQ_ret_5z: { label: "Tehnologie SUA (Nasdaq-100) · randament 5 zile", kind: "pct" },
  NASDAQ_vol_20z: { label: "Tehnologie SUA (Nasdaq-100) · volatilitate o lună", kind: "pct" },
  MSCI_EM_ret_5z: { label: "Piețe emergente · randament 5 zile", kind: "pct" },
  MSCI_EM_vol_20z: { label: "Piețe emergente · volatilitate o lună", kind: "pct" },
  MSCI_EM_drawdown_250z: { label: "Piețe emergente · sub maximul anual", kind: "pct" },
  VIX_chg_20z: { label: "Indicele fricii (VIX) · variație o lună", kind: "pct" },
  VIX_z_250z: { label: "Indicele fricii (VIX) · față de media anuală", kind: "z" },
  AUR_ret_20z: { label: "Aur · randament o lună", kind: "pct" },
  BRENT_ret_5z: { label: "Petrol Brent · randament 5 zile", kind: "pct" },
  BRENT_ret_60z: { label: "Petrol Brent · randament 3 luni", kind: "pct" },
  CUPRU_AUR_ret_60z: { label: "Raport cupru / aur · 3 luni", kind: "pct" },
  STOXX600_ppo_hist: { label: "Bursele europene · impuls de trend (MACD)", kind: "num" },
  SP500_rsi14: { label: "Bursa americană (S&P 500) · RSI", kind: "rsi" },
  MSCI_EM_rsi14: { label: "Piețe emergente · RSI", kind: "rsi" },
  BRENT_rsi14: { label: "Petrol Brent · RSI", kind: "rsi" },
  GSCPI_chg3: { label: "Presiune pe lanțurile globale de aprovizionare · 3 luni", kind: "num" },
  Export_crestere_anuala: { label: "Exporturile României · creștere anuală", kind: "pct" },
  TXT_GLOBAL_soc_negativ: { label: "Ton negativ în rapoartele BCE, BIS, Eurostat · șoc recent", kind: "num" },
  ROBOR_ROBID_spread_3M_z365: { label: "Diferența ROBOR–ROBID la 3 luni · față de media anuală", kind: "z" },
  Import_energie_pondere_z365: { label: "Ponderea energiei în importurile României · față de media anuală", kind: "z" },
  TXT_GLOBAL_lex_ton_net_hl7_z365: { label: "Optimismul rapoartelor economice globale · față de media anuală", kind: "z" },
};

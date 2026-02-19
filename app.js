(function () {
  'use strict';

  function byId(id) {
    return document.getElementById(id);
  }

  function debounce(func, wait) {
    var timeout;
    return function () {
      var context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        func.apply(context, args);
      }, wait);
    };
  }

  function formatCurrency(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    var abs = Math.abs(Math.round(n));
    var str = '$' + abs.toLocaleString('en-AU');
    return n < 0 ? '−' + str : str;
  }

  function calcInterestReserve(netPrincipal, rate, buildMonths, facilityTermMonths) {
    var monthlyRate = rate / 12;
    var tailMonths = Math.max(0, facilityTermMonths - buildMonths);
    var balance = netPrincipal;
    var totalInterest = 0;
    
    for (var month = 1; month <= buildMonths; month++) {
      var utilization = 0.55;
      var interestThisMonth = balance * utilization * monthlyRate;
      totalInterest += interestThisMonth;
      balance = balance + interestThisMonth;
    }
    
    for (var month = 1; month <= tailMonths; month++) {
      var utilization = 1.0;
      var interestThisMonth = balance * utilization * monthlyRate;
      totalInterest += interestThisMonth;
      balance = balance + interestThisMonth;
    }
    
    return totalInterest;
  }

  function solveFacilitySize(constructionRequired, rate, buildMonths, facilityTermMonths, fundingFeePct) {
    if (constructionRequired <= 0 || rate <= 0 || buildMonths <= 0) return 0;
    var feeRate = fundingFeePct / 100;
    var facility = constructionRequired * 1.15;
    
    for (var i = 0; i < 30; i++) {
      var establishmentFee = facility * feeRate;
      var netPrincipal = constructionRequired + establishmentFee;
      var interestReserve = calcInterestReserve(netPrincipal, rate, buildMonths, facilityTermMonths);
      var calculatedFacility = (constructionRequired + interestReserve) / (1 - feeRate);
      var diff = Math.abs(facility - calculatedFacility);
      if (diff < 1) break;
      facility = calculatedFacility;
    }
    
    return facility;
  }

  function getInputs() {
    var currentLandValue = parseFloat(byId('currentLandValue').value) || 0;
    var totalGRV = parseFloat(byId('totalGRV').value) || 0;
    
    var numLots = parseInt(byId('numLots').value, 10) || 0;
    var lotsSoldEl = byId('lotsExpectedToSell');
    var lotsExpectedToSell = parseInt(lotsSoldEl.value, 10) || 0;
    lotsSoldEl.setAttribute('max', String(numLots));
    lotsExpectedToSell = Math.min(Math.max(0, lotsExpectedToSell), numLots);
    if (parseInt(lotsSoldEl.value, 10) !== lotsExpectedToSell) lotsSoldEl.value = lotsExpectedToSell;
    var avgSalePrice = parseFloat(byId('avgSalePrice').value) || 0;
    var gdv = lotsExpectedToSell * avgSalePrice;
    
    var netSalesRevenue = gdv;
    
    var fundingFeePct = 3;
    var constructionRequired = parseFloat(byId('constructionAmountRequired').value) || 0;
    var interestRatePct = parseFloat(byId('interestRatePct').value) || 0;
    var constructionPeriodMonths = parseFloat(byId('constructionPeriodMonths').value) || 0;
    var facilityTermMonths = parseFloat(byId('facilityTermMonths').value) || 0;
    byId('facilityTermMonths').setAttribute('min', String(constructionPeriodMonths));
    
    var rate = interestRatePct / 100;
    var amountFinanced = solveFacilitySize(constructionRequired, rate, constructionPeriodMonths, facilityTermMonths, fundingFeePct);
    byId('calculatedFacilitySize').textContent = formatCurrency(amountFinanced);
    return {
      currentLandValue: currentLandValue,
      totalGRV: totalGRV,
      numLots: numLots,
      lotsExpectedToSell: lotsExpectedToSell,
      avgSalePrice: avgSalePrice,
      gdv: gdv,
      netSalesRevenue: netSalesRevenue,
      constructionCost: parseFloat(byId('constructionCost').value) || 0,
      professionalFeesPct: parseFloat(byId('professionalFeesPct').value) || 0,
      amountFinanced: amountFinanced,
      interestRatePct: interestRatePct,
      constructionPeriodMonths: constructionPeriodMonths,
      facilityTermMonths: facilityTermMonths,
      fundingFeePct: fundingFeePct,
      constructionRequired: constructionRequired,
      salesMarketingPct: parseFloat(byId('salesMarketingPct').value) || 0,
      contingencyPct: parseFloat(byId('contingencyPct').value) || 0,
      otherCosts: parseFloat(byId('otherCosts').value) || 0,
      developerMarginPct: parseFloat(byId('developerMarginPct').value) || 0
    };
  }

  function calcCosts(i) {
    var prof = (i.professionalFeesPct / 100) * i.constructionCost;
    var buildMonths = i.constructionPeriodMonths;
    var tailMonths = Math.max(0, (i.facilityTermMonths || buildMonths) - buildMonths);
    var rate = i.interestRatePct / 100;
    var monthlyRate = rate / 12;
    
    var establishmentFee = (i.fundingFeePct / 100) * i.amountFinanced;
    var netPrincipal = i.constructionRequired + establishmentFee;
    
    var balance = netPrincipal;
    var totalInterest = 0;
    
    for (var month = 1; month <= buildMonths; month++) {
      var utilization = 0.55;
      var interestThisMonth = balance * utilization * monthlyRate;
      totalInterest += interestThisMonth;
      balance = balance + interestThisMonth;
    }
    
    for (var month = 1; month <= tailMonths; month++) {
      var utilization = 1.0;
      var interestThisMonth = balance * utilization * monthlyRate;
      totalInterest += interestThisMonth;
      balance = balance + interestThisMonth;
    }
    
    var finance = totalInterest;
    var fundingFee = establishmentFee;
    var sales = (i.salesMarketingPct / 100) * i.gdv;
    var contingency = (i.contingencyPct / 100) * i.constructionCost;
    var margin = (i.developerMarginPct / 100) * i.gdv;
    return {
      professionalFees: prof,
      financeCosts: finance,
      fundingFee: fundingFee,
      salesMarketing: sales,
      contingency: contingency,
      developerMargin: margin
    };
  }

  function calcRLV(gdv, constructionCost, costs, otherCosts) {
    return gdv - constructionCost - costs.professionalFees - costs.financeCosts - costs.fundingFee
      - costs.salesMarketing - costs.contingency - otherCosts - costs.developerMargin;
  }

  function update() {
    var i = getInputs();
    var c = calcCosts(i);
    var rlv = calcRLV(i.gdv, i.constructionCost, c, i.otherCosts);
    var rlvPerLot = i.numLots > 0 ? rlv / i.numLots : 0;
    var profitMarginPct = i.gdv > 0 ? ((i.gdv - i.constructionCost - c.professionalFees - c.financeCosts - c.fundingFee - c.salesMarketing - c.contingency - i.otherCosts) / i.gdv) * 100 : null;
    
    var projectLift = i.totalGRV - (i.currentLandValue + i.constructionCost);
    var totalCosts = i.constructionCost + c.professionalFees + c.financeCosts + c.fundingFee + c.salesMarketing + c.contingency + i.otherCosts;
    var netValueCreated = i.totalGRV - totalCosts;
    var roe = i.currentLandValue > 0 ? (projectLift / i.currentLandValue) * 100 : null;
    var ltv = i.totalGRV > 0 ? ((i.amountFinanced / i.totalGRV) * 100) : null;
    var ltc = (i.currentLandValue + i.constructionCost) > 0 ? ((i.amountFinanced / (i.currentLandValue + i.constructionCost)) * 100) : null;
    var dcr = i.amountFinanced > 0 ? (i.gdv / i.amountFinanced) : null;

    byId('netSalesRevenue').textContent = formatCurrency(i.netSalesRevenue);
    byId('startingValue').textContent = formatCurrency(i.currentLandValue);
    byId('endValue').textContent = formatCurrency(i.totalGRV);
    byId('gdv').textContent = formatCurrency(i.gdv);
    byId('rlv').textContent = formatCurrency(rlv);
    
    // RLV feasibility check and hint update
    var rlvHintEl = byId('rlv-hint');
    if (rlvHintEl) {
      if (rlv < i.currentLandValue && i.currentLandValue > 0) {
        rlvHintEl.textContent = 'Warning: RLV below land value — project may be unfeasible';
        rlvHintEl.classList.add('warning');
      } else if (rlv < 0) {
        rlvHintEl.textContent = 'Cash shortfall required — additional funds needed';
        rlvHintEl.classList.add('warning');
      } else {
        rlvHintEl.textContent = 'Maximum you should pay for the site';
        rlvHintEl.classList.remove('warning');
      }
    }
    
    var rlvEl = byId('rlv');
    if (rlvEl) {
      rlvEl.classList.remove('warning', 'success');
      if (rlv < i.currentLandValue && i.currentLandValue > 0) {
        rlvEl.classList.add('warning');
      } else if (rlv >= i.currentLandValue && i.currentLandValue > 0) {
        rlvEl.classList.add('success');
      }
    }
    
    byId('rlvPerLot').textContent = formatCurrency(rlvPerLot);
    if (byId('developerProfit')) byId('developerProfit').textContent = formatCurrency(c.developerMargin);
    byId('profitMarginPct').textContent = profitMarginPct != null ? profitMarginPct.toFixed(1) + '%' : '—';
    
    if (byId('projectLift')) byId('projectLift').textContent = formatCurrency(projectLift);
    if (byId('roe')) byId('roe').textContent = roe != null ? roe.toFixed(1) + '%' : '—';
    if (byId('ltv')) byId('ltv').textContent = ltv != null ? ltv.toFixed(1) + '%' : '—';
    if (byId('ltc')) byId('ltc').textContent = ltc != null ? ltc.toFixed(1) + '%' : '—';
    if (byId('dcr')) byId('dcr').textContent = dcr != null ? dcr.toFixed(2) + 'x' : '—';
    if (byId('netValueCreated')) byId('netValueCreated').textContent = formatCurrency(netValueCreated);

    byId('b-gdv').textContent = formatCurrency(i.gdv);
    byId('b-construction').textContent = '−' + formatCurrency(i.constructionCost);
    byId('b-professional').textContent = '−' + formatCurrency(c.professionalFees);
    byId('b-finance').textContent = '−' + formatCurrency(c.financeCosts);
    byId('b-funding-fee').textContent = '−' + formatCurrency(c.fundingFee);
    if (c.fundingFee > 0 || c.financeCosts > 0) {
      byId('b-funding-fee-row').style.display = '';
      byId('fundingFeeDisplay').style.display = '';
      if (byId('financeCostDisplay')) byId('financeCostDisplay').style.display = '';
    } else {
      byId('b-funding-fee-row').style.display = 'none';
      byId('fundingFeeDisplay').style.display = 'none';
      if (byId('financeCostDisplay')) byId('financeCostDisplay').style.display = 'none';
    }
    byId('derived-funding-fee').textContent = '→ ' + formatCurrency(c.fundingFee);
    if (byId('derived-finance-cost')) byId('derived-finance-cost').textContent = '→ ' + formatCurrency(c.financeCosts);
    byId('b-sales').textContent = '−' + formatCurrency(c.salesMarketing);
    byId('b-contingency').textContent = '−' + formatCurrency(c.contingency);
    byId('b-other').textContent = '−' + formatCurrency(i.otherCosts);
    byId('b-margin').textContent = '−' + formatCurrency(c.developerMargin);
    byId('b-rlv').textContent = formatCurrency(rlv);

    // Net Settlement Position calculations
    // Note: Professional Fees and Contingency are NOT included here as they are paid during construction, not at settlement
    var grossSales = i.gdv;
    var sellingCosts = c.salesMarketing;
    var facilityRepayment = i.amountFinanced;
    var otherCosts = i.otherCosts;
    var cashResult = grossSales - sellingCosts - facilityRepayment - otherCosts;
    
    if (byId('settlement-gross-sales')) byId('settlement-gross-sales').textContent = formatCurrency(grossSales);
    if (byId('settlement-selling-costs')) byId('settlement-selling-costs').textContent = '−' + formatCurrency(sellingCosts);
    if (byId('settlement-facility')) byId('settlement-facility').textContent = '−' + formatCurrency(facilityRepayment);
    if (byId('settlement-other-costs')) byId('settlement-other-costs').textContent = '−' + formatCurrency(otherCosts);
    if (byId('settlement-cash-result')) {
      byId('settlement-cash-result').textContent = formatCurrency(cashResult);
      var settlementResultEl = byId('settlement-result');
      if (settlementResultEl) {
        settlementResultEl.classList.remove('positive', 'negative');
        if (cashResult > 0) {
          settlementResultEl.classList.add('positive');
        } else if (cashResult < 0) {
          settlementResultEl.classList.add('negative');
        }
      }
    }

    if (byId('derived-professional')) byId('derived-professional').textContent = '→ ' + formatCurrency(c.professionalFees);
    if (byId('derived-finance')) byId('derived-finance').textContent = '→ ' + formatCurrency(c.financeCosts);
    if (byId('derived-sales')) byId('derived-sales').textContent = '→ ' + formatCurrency(c.salesMarketing);
    if (byId('derived-contingency')) byId('derived-contingency').textContent = '→ ' + formatCurrency(c.contingency);
    if (byId('derived-margin')) byId('derived-margin').textContent = '→ ' + formatCurrency(c.developerMargin);

    var sens = [-0.10, -0.05, 0, 0.05, 0.10];
    var grossSalesKeys = ['s-gdv-m10', 's-gdv-m5', 's-gdv-base', 's-gdv-p5', 's-gdv-p10'];
    var rlvKeys = ['s-rlv-m10', 's-rlv-m5', 's-rlv-base', 's-rlv-p5', 's-rlv-p10'];
    var financeCost = c.financeCosts;
    var fundingFee = c.fundingFee;
    sens.forEach(function (pct, idx) {
      // Calculate alternative Gross Sales based on price movement
      var gdvAlt = i.gdv * (1 + pct);
      var cAlt = {
        professionalFees: (i.professionalFeesPct / 100) * i.constructionCost,
        financeCosts: financeCost,
        fundingFee: fundingFee,
        salesMarketing: (i.salesMarketingPct / 100) * gdvAlt,
        contingency: (i.contingencyPct / 100) * i.constructionCost,
        developerMargin: (i.developerMarginPct / 100) * gdvAlt
      };
      var rlvAlt = calcRLV(gdvAlt, i.constructionCost, cAlt, i.otherCosts);
      byId(grossSalesKeys[idx]).textContent = formatCurrency(gdvAlt);
      byId(rlvKeys[idx]).textContent = formatCurrency(rlvAlt);
    });
  }

  var debouncedUpdate = debounce(update, 300);
  // Fields that should update derived values immediately (percentage fields with arrows)
  // These include percentage inputs and their dependencies (constructionCost affects professional fees/contingency, 
  // avgSalePrice/lotsExpectedToSell affect sales & marketing and developer margin)
  var immediateUpdateFields = ['professionalFeesPct', 'contingencyPct', 'salesMarketingPct', 'developerMarginPct', 'constructionCost', 'avgSalePrice', 'lotsExpectedToSell', 'numLots'];
  
  var inputs = ['currentLandValue', 'totalGRV', 'numLots', 'lotsExpectedToSell', 'avgSalePrice', 'constructionCost', 'professionalFeesPct', 'constructionAmountRequired', 'interestRatePct', 'constructionPeriodMonths', 'facilityTermMonths', 'salesMarketingPct', 'contingencyPct', 'otherCosts', 'developerMarginPct'];
  inputs.forEach(function (id) {
    var el = byId(id);
    if (el) {
      // Use immediate update for fields that affect derived values with arrows
      if (immediateUpdateFields.indexOf(id) !== -1) {
        el.addEventListener('input', update);
      } else {
        el.addEventListener('input', debouncedUpdate);
      }
      el.addEventListener('change', update);
      el.addEventListener('focus', function () {
        if (this.value === '0' || this.value === '0.0' || this.value === '0.00') {
          this.value = '';
        }
      });
      el.addEventListener('blur', function () {
        if (this.value === '' || this.value === null) {
          this.value = '0';
          update();
        }
      });
    }
  });

  var facilityTermEl = byId('facilityTermMonths');
  var constructionPeriodEl = byId('constructionPeriodMonths');
  
  function enforceFacilityTermConstraint(facilityEl, constructionEl) {
    if (facilityEl && constructionEl) {
      facilityEl.addEventListener('blur', function () {
        var constructionPeriod = parseFloat(constructionEl.value) || 0;
        var facilityTerm = parseFloat(this.value) || 0;
        if (constructionPeriod > 0 && facilityTerm < constructionPeriod) {
          this.value = constructionPeriod;
          update();
        }
      });
      constructionEl.addEventListener('change', function () {
        var constructionPeriod = parseFloat(this.value) || 0;
        var facilityTerm = parseFloat(facilityTermEl.value) || 0;
        if (constructionPeriod > 0 && facilityTerm < constructionPeriod) {
          facilityTermEl.value = constructionPeriod;
          update();
        }
      });
    }
  }
  
  enforceFacilityTermConstraint(facilityTermEl, constructionPeriodEl);

  update();

  // Initialize tooltips after DOM is ready
  function initTooltips() {
    // Tooltip click-only behavior (no hover/focus activation)
    var tooltipIcons = document.querySelectorAll('.tooltip-icon');
    var activeTooltip = null;
    
    tooltipIcons.forEach(function(icon) {
      // Remove any existing listeners to avoid duplicates
      var newIcon = icon.cloneNode(true);
      icon.parentNode.replaceChild(newIcon, icon);
      
      newIcon.setAttribute('role', 'button');
      newIcon.setAttribute('aria-label', 'Show help information');
      newIcon.setAttribute('tabindex', '0');
      newIcon.style.cursor = 'pointer';
      
      newIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        var wrapper = newIcon.closest('.tooltip-wrapper');
        if (!wrapper) return;
        
        var tooltip = wrapper.querySelector('.tooltip-content');
        if (!tooltip) return;
        
        var isActive = wrapper.classList.contains('tooltip-active');
        
        // Close all tooltips first
        document.querySelectorAll('.tooltip-wrapper').forEach(function(w) {
          w.classList.remove('tooltip-active');
        });
        
        // Toggle this tooltip
        if (!isActive) {
          wrapper.classList.add('tooltip-active');
          activeTooltip = wrapper;
        } else {
          activeTooltip = null;
        }
      });
      
      newIcon.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          newIcon.click();
        }
      });
    });

    // Close tooltips when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.tooltip-wrapper')) {
        document.querySelectorAll('.tooltip-wrapper').forEach(function(wrapper) {
          wrapper.classList.remove('tooltip-active');
        });
        activeTooltip = null;
      }
    });
  }

  // Initialize tooltips when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTooltips);
  } else {
    initTooltips();
  }

  // Help panel functionality
  var helpBtn = byId('helpBtn');
  var helpClose = byId('helpClose');
  var helpPanel = byId('helpPanel');
  
  if (helpBtn && helpPanel) {
    helpBtn.addEventListener('click', function() {
      helpPanel.style.display = 'block';
      document.body.style.overflow = 'hidden';
    });
  }
  
  if (helpClose && helpPanel) {
    helpClose.addEventListener('click', function() {
      helpPanel.style.display = 'none';
      document.body.style.overflow = '';
    });
  }
  
  if (helpPanel) {
    helpPanel.addEventListener('click', function(e) {
      if (e.target === helpPanel) {
        helpPanel.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  }

  // Expandable sections
  var advancedCostsToggle = byId('advancedCostsToggle');
  var advancedCostsContent = byId('advancedCostsContent');
  
  if (advancedCostsToggle && advancedCostsContent) {
    // Set initial state to expanded
    advancedCostsToggle.setAttribute('aria-expanded', 'true');
    advancedCostsContent.style.display = 'block';
    if (advancedCostsToggle.querySelector('.toggle-icon')) {
      advancedCostsToggle.querySelector('.toggle-icon').style.transform = 'rotate(180deg)';
    }
    
    advancedCostsToggle.addEventListener('click', function() {
      var isExpanded = advancedCostsToggle.getAttribute('aria-expanded') === 'true';
      advancedCostsContent.style.display = isExpanded ? 'none' : 'block';
      advancedCostsToggle.setAttribute('aria-expanded', !isExpanded);
      if (advancedCostsToggle.querySelector('.toggle-icon')) {
        advancedCostsToggle.querySelector('.toggle-icon').style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
      }
    });
  }

  var resultsDetailsToggle = byId('resultsDetailsToggle');
  var resultsDetailsContent = byId('resultsDetailsContent');
  
  if (resultsDetailsToggle && resultsDetailsContent) {
    resultsDetailsToggle.addEventListener('click', function() {
      var isExpanded = resultsDetailsToggle.getAttribute('aria-expanded') === 'true';
      resultsDetailsContent.style.display = isExpanded ? 'none' : 'block';
      resultsDetailsToggle.setAttribute('aria-expanded', !isExpanded);
      resultsDetailsToggle.querySelector('.toggle-icon').style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
    });
  }

  // PDF Export
  var exportPdfBtn = byId('exportPdfBtn');
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', exportToPDF);
  }

  function exportToPDF() {
    var JsPDF = window.jspdf.jsPDF || window.jspdf.default;
    if (!JsPDF) {
      alert('PDF library not loaded. Please refresh the page.');
      return;
    }

    var doc = new JsPDF('portrait', 'mm', 'a4');
    var MARGIN = 15;
    var PAGE_WIDTH = 210;
    var PAGE_HEIGHT = 297;
    var CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
    var y = MARGIN;

    function val(id) {
      var el = document.getElementById(id);
      if (!el) return '';
      var text = el.textContent.trim();
      // Clean up currency values - remove extra spaces between digits
      // Replace patterns like "$ 3 , 0 0 0" with "$3,000"
      text = text.replace(/\$\s*([\d\s,]+)/g, function(match, digits) {
        var cleaned = digits.replace(/\s+/g, '');
        return '$' + cleaned;
      });
      // Also handle negative values with minus sign
      text = text.replace(/−\s*\$?\s*([\d\s,]+)/g, function(match, digits) {
        var cleaned = digits.replace(/\s+/g, '');
        return '−$' + cleaned;
      });
      return text;
    }

    function ensurePage(doc, y) {
      if (y > PAGE_HEIGHT - 30) {
        doc.addPage();
        // Draw header on new page
        doc.setFillColor(0, 43, 91);
        var headerHeight = 14;
        doc.rect(0, 0, PAGE_WIDTH, headerHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('Mercer Funding Group', MARGIN, headerHeight - 4);
        return MARGIN + 5;
      }
      return y;
    }

    function sectionTitle(doc, title, y) {
      y = ensurePage(doc, y);
      doc.setTextColor(0, 43, 91);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(title, MARGIN, y);
      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 43, 91);
      doc.line(MARGIN, y + 1, MARGIN + 40, y + 1);
      return y + 6;
    }

    function runAutoTable(doc, opts) {
      // Set default font settings for consistency
      if (!opts.styles) opts.styles = {};
      opts.styles.font = 'helvetica';
      opts.styles.fontSize = opts.styles.fontSize || 9;
      opts.styles.cellPadding = opts.styles.cellPadding || 3;
      opts.styles.overflow = 'linebreak';
      opts.styles.cellWidth = 'wrap';
      
      // Ensure consistent column widths
      if (!opts.columnStyles) opts.columnStyles = {};
      
      if (typeof doc.autoTable === 'function') {
        doc.autoTable(opts);
      } else if (window.jspdf && typeof window.jspdf.autoTable === 'function') {
        window.jspdf.autoTable(doc, opts);
      } else {
        console.error('AutoTable plugin not available');
      }
    }

    // Title block
    var projectName = byId('projectName') ? byId('projectName').value.trim() : '';
    var titleText = projectName 
      ? 'Property Development Feasibility Summary - ' + projectName
      : 'Property Development Feasibility Summary';
    
    var titleLines = doc.splitTextToSize(titleText, CONTENT_WIDTH);
    var titleLineHeight = 7.5;
    var headerHeight = (titleLines.length * titleLineHeight) + 8;
    
    doc.setFillColor(0, 43, 91);
    doc.rect(0, 0, PAGE_WIDTH, headerHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    var currentY = 6;
    for (var i = 0; i < titleLines.length; i++) {
      doc.text(titleLines[i], MARGIN, currentY);
      currentY += titleLineHeight;
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Mercer Funding Group', MARGIN, headerHeight - 4);
    
    var now = new Date();
    var day = String(now.getDate()).padStart(2, '0');
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var year = now.getFullYear();
    var hours = now.getHours();
    var minutes = String(now.getMinutes()).padStart(2, '0');
    var seconds = String(now.getSeconds()).padStart(2, '0');
    var ampm = hours >= 12 ? 'pm' : 'am';
    var hours12 = hours % 12;
    if (hours12 === 0) hours12 = 12;
    hours12 = String(hours12).padStart(2, '0');
    var dateStr = day + '/' + month + '/' + year;
    var timeStr = hours12 + ':' + minutes + ':' + seconds + ' ' + ampm;
    doc.text('Generated: ' + dateStr + ', ' + timeStr, PAGE_WIDTH - MARGIN, headerHeight - 4, { align: 'right' });
    
    y = headerHeight + 10;

    // Project Summary
    y = sectionTitle(doc, 'Project Summary', y);
    runAutoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Current Market Value (As-Is)', val('startingValue')],
        ['On-Completion Value (As-Complete)', val('endValue')]
      ],
      theme: 'plain',
      headStyles: { fillColor: [0, 43, 91], textColor: 255, fontStyle: 'bold', font: 'helvetica' },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 60, halign: 'right' } },
      styles: { fontSize: 9, font: 'helvetica' },
      margin: { left: MARGIN, right: MARGIN }
    });
    y = doc.lastAutoTable.finalY + 8;

    // Project Health
    y = sectionTitle(doc, 'Project Health', y);
    runAutoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Forecast LVR (Loan/GRV)', val('ltv')],
        ['Loan to Cost (LTC)', val('ltc')],
        ['Debt Coverage Ratio (DCR)', val('dcr')]
      ],
      theme: 'plain',
      headStyles: { fillColor: [0, 43, 91], textColor: 255, fontStyle: 'bold', font: 'helvetica' },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 60, halign: 'right' } },
      styles: { fontSize: 9, font: 'helvetica' },
      margin: { left: MARGIN, right: MARGIN }
    });
    y = doc.lastAutoTable.finalY + 8;

    // Profitability
    y = sectionTitle(doc, 'Profitability', y);
    runAutoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Net Value Creation', val('netValueCreated')],
        ['Return on Equity (ROE)', val('roe')],
        ['Profit margin %', val('profitMarginPct')],
        ['Developer profit', val('developerProfit')],
        ['RLV per lot', val('rlvPerLot')]
      ],
      theme: 'plain',
      headStyles: { fillColor: [0, 43, 91], textColor: 255, fontStyle: 'bold', font: 'helvetica' },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 60, halign: 'right' } },
      styles: { fontSize: 9, font: 'helvetica' },
      margin: { left: MARGIN, right: MARGIN }
    });
    y = doc.lastAutoTable.finalY + 8;

    // The Bottom Line
    y = sectionTitle(doc, 'The Bottom Line', y);
    runAutoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Residual Land Value (RLV)', val('rlv')]
      ],
      theme: 'plain',
      headStyles: { fillColor: [0, 43, 91], textColor: 255, fontStyle: 'bold', font: 'helvetica' },
      bodyStyles: { fillColor: [240, 240, 240], textColor: [0, 43, 91], fontStyle: 'bold', font: 'helvetica' },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 60, halign: 'right' } },
      styles: { fontSize: 11, font: 'helvetica' },
      margin: { left: MARGIN, right: MARGIN }
    });
    y = doc.lastAutoTable.finalY + 8;

    // Breakdown
    y = sectionTitle(doc, 'Breakdown', y);
    var breakdownBody = [
      ['Gross Sales', val('b-gdv')]
    ];
    
    // Add construction cost
    var constructionVal = val('b-construction');
    if (constructionVal && constructionVal !== '$0' && constructionVal !== '−$0') {
      breakdownBody.push(['Construction cost', constructionVal]);
    }
    
    // Add professional fees
    var professionalVal = val('b-professional');
    if (professionalVal && professionalVal !== '$0' && professionalVal !== '−$0') {
      breakdownBody.push(['Professional fees', professionalVal]);
    }
    
    // Add finance costs
    var financeVal = val('b-finance');
    if (financeVal && financeVal !== '$0' && financeVal !== '−$0') {
      breakdownBody.push(['Finance costs', financeVal]);
    }
    
    // Add establishment fee if it exists
    var fundingFeeVal = val('b-funding-fee');
    if (fundingFeeVal && fundingFeeVal !== '$0' && fundingFeeVal !== '−$0') {
      breakdownBody.push(['Establishment fee (3%)', fundingFeeVal]);
    }
    
    // Add sales & marketing
    var salesVal = val('b-sales');
    if (salesVal && salesVal !== '$0' && salesVal !== '−$0') {
      breakdownBody.push(['Sales & marketing', salesVal]);
    }
    
    // Add contingency
    var contingencyVal = val('b-contingency');
    if (contingencyVal && contingencyVal !== '$0' && contingencyVal !== '−$0') {
      breakdownBody.push(['Contingency', contingencyVal]);
    }
    
    // Add other costs
    var otherVal = val('b-other');
    if (otherVal && otherVal !== '$0' && otherVal !== '−$0') {
      breakdownBody.push(['Other costs', otherVal]);
    }
    
    // Add developer margin
    var marginVal = val('b-margin');
    if (marginVal && marginVal !== '$0' && marginVal !== '−$0') {
      breakdownBody.push(['Developer margin', marginVal]);
    }
    
    // Add RLV
    breakdownBody.push(['Residual Land Value', val('b-rlv')]);
    
    runAutoTable(doc, {
      startY: y,
      head: [['Item', 'Amount']],
      body: breakdownBody,
      theme: 'striped',
      headStyles: { fillColor: [0, 43, 91], textColor: 255, fontStyle: 'bold', font: 'helvetica' },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 60, halign: 'right', font: 'helvetica' } },
      styles: { fontSize: 9, font: 'helvetica' },
      margin: { left: MARGIN, right: MARGIN }
    });
    y = doc.lastAutoTable.finalY + 8;

    // Net Settlement Position
    y = sectionTitle(doc, 'Net Settlement Position', y);
    runAutoTable(doc, {
      startY: y,
      head: [['Item', 'Amount']],
      body: [
        ['Gross Sales', val('settlement-gross-sales')],
        ['Less Selling Costs', val('settlement-selling-costs')],
        ['Less Facility Repayment', val('settlement-facility')],
        ['Less Other Costs', val('settlement-other-costs')],
        ['Cash Result', val('settlement-cash-result')]
      ],
      theme: 'plain',
      headStyles: { fillColor: [0, 43, 91], textColor: 255, fontStyle: 'bold', font: 'helvetica' },
      columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 60, halign: 'right', font: 'helvetica' } },
      styles: { fontSize: 9, font: 'helvetica' },
      margin: { left: MARGIN, right: MARGIN }
    });
    y = doc.lastAutoTable.finalY + 8;

    // Sensitivity Analysis
    y = sectionTitle(doc, 'Sensitivity Analysis', y);
    runAutoTable(doc, {
      startY: y,
      head: [['Price Movement', 'Gross Sales', 'RLV']],
      body: [
        ['-10%', val('s-gdv-m10'), val('s-rlv-m10')],
        ['-5%', val('s-gdv-m5'), val('s-rlv-m5')],
        ['Base', val('s-gdv-base'), val('s-rlv-base')],
        ['+5%', val('s-gdv-p5'), val('s-rlv-p5')],
        ['+10%', val('s-gdv-p10'), val('s-rlv-p10')]
      ],
      theme: 'striped',
      headStyles: { fillColor: [0, 43, 91], textColor: 255, fontStyle: 'bold', font: 'helvetica' },
      columnStyles: { 
        0: { cellWidth: 45, font: 'helvetica' }, 
        1: { cellWidth: 67.5, halign: 'right', font: 'helvetica' }, 
        2: { cellWidth: 67.5, halign: 'right', font: 'helvetica' } 
      },
      styles: { fontSize: 9, font: 'helvetica' },
      margin: { left: MARGIN, right: MARGIN }
    });
    y = doc.lastAutoTable.finalY + 12;

    // Footer
    y = ensurePage(doc, y);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    var footerText = 'Disclaimer: This calculator provides estimates only. Results are for general guidance and should not be relied upon for investment decisions. Always verify with professional advice and detailed feasibility analysis before making acquisition or funding decisions.';
    var footerLines = doc.splitTextToSize(footerText, CONTENT_WIDTH);
    footerLines.forEach(function(line) {
      y = ensurePage(doc, y);
      doc.text(line, MARGIN, y);
      y += 4;
    });
    
    y = ensurePage(doc, y);
    doc.setFont('helvetica', 'normal');
    doc.text('Mercer Funding Group | mercerfg.com.au', PAGE_WIDTH / 2, y, { align: 'center' });

    doc.save((projectName || 'feasibility-summary') + '.pdf');
  }
})();

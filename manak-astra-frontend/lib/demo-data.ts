// E:\projects\Completed Projects\ManakAstra\manak-astra-frontend\lib\demo-data.ts

import { AnalysisPayload, AnalysisResponse } from "./types";

export function getDemoData(payload: AnalysisPayload): AnalysisResponse {
  const query = payload.search_query.toLowerCase();
  const product = payload.detected_product.toLowerCase();
  
  // 1. Transformer Demo
  if (query.includes("transformer") || product.includes("transformer")) {
    return generateTransformerDemo(payload);
  }
  
  // 2. Centrifugal Pump Demo
  if (query.includes("pump") || product.includes("pump") || query.includes("centrifugal")) {
    return generatePumpDemo(payload);
  }
  
  // 3. Solar Module Demo
  if (query.includes("solar") || product.includes("solar") || query.includes("photovoltaic")) {
    return generateSolarDemo(payload);
  }
  
  // Default to PVC Cable Demo (The primary English audit demo)
  return generateCableDemo(payload);
}

// -------------------------------------------------------------
// DEMO PAYLOADS
// -------------------------------------------------------------

function generateCableDemo(payload: AnalysisPayload): AnalysisResponse {
  const isAudit = payload.workflow_mode === "audit";
  
  return {
    status: "success",
    workflow_mode: payload.workflow_mode || "search",
    notice: "Operating in Offline Demo Mode (Backend Unreachable). Results are pre-calculated for demonstration.",
    query_context: payload,
    primary_standards: [{
      standard_id: "IS 694",
      full_title: "Polyvinyl Chloride Insulated Unsheathed and Sheathed Cables/Cords with Rigid and Flexible Conductor for Rated Voltages - Up to and Including 450/750 V",
      mandatory_qco: true,
      scheme: "Scheme-I (ISI Mark)",
      status: "ACTIVE",
      latest_version: "IS 694 : 2010",
      similarity: 92.4,
      rrf_score: 0.021
    }],
    candidate_standards: [
      {
        standard_id: "IS 1554 (Part 1)",
        full_title: "PVC insulated (heavy duty) electric cables: Part 1 for working voltages up to and including 1100 V",
        type: "RELATED",
        confidence: "Suggested",
        similarity: 88.1,
        reason: "Alternate standard specifically covering heavy duty PVC cables for 1100 V."
      },
      {
        standard_id: "IS 7098 (Part 1)",
        full_title: "Crosslinked polyethylene insulated PVC sheathed cables: Part 1 For working voltage up to and including 1100 V",
        type: "RELATED",
        confidence: "Suggested",
        similarity: 81.5,
        reason: "Alternative insulation material (XLPE) for the same voltage rating."
      }
    ],
    ecosystem_standards: [
      { standard_id: "IS 10810 (Part 1)", full_title: "Methods of test for cables - Part 1: Annealing test for copper", relationship_type: "TEST_METHOD", confidence: "Verified" },
      { standard_id: "IS 8130", full_title: "Conductors for Insulated Electrical Cables and Flexible Cords", relationship_type: "MATERIAL", confidence: "Verified" },
      { standard_id: "IS 5831", full_title: "PVC insulation and sheath of electric cables", relationship_type: "MATERIAL", confidence: "Verified" }
    ],
    certifications: [
      { name: "BIS Product Certification", scheme: "Scheme-I (ISI Mark)", status: "VERIFIED", source_ref: "BIS Catalogue Database" },
      { name: "Electrical Wires, Cables, Appliances and Protection Devices and Accessories (Quality Control) Order, 2003", scheme: "Mandatory QCO", status: "VERIFIED", source_ref: "DPIIT QCO" }
    ],
    coverage_alerts: isAudit && !payload.cited_standards.includes("IS 8130") ? [
      {
        standard_id: "IS 8130",
        title: "Conductors for Insulated Electrical Cables and Flexible Cords",
        reason: "Normative requirement for copper conductors is missing from your cited references.",
        severity: "medium",
        action_required: "Add IS 8130 to your tender."
      },
      {
        standard_id: "IS 5831",
        title: "PVC insulation and sheath of electric cables",
        reason: "Required MATERIAL is missing from your cited references.",
        severity: "high",
        action_required: "Add IS 5831 to your tender."
      }
    ] : [],
    draft_tender_clause: "The cable shall strictly conform to IS 694 and shall bear the ISI mark under a valid BIS license. Bidders must provide complete type test reports demonstrating compliance with IS 8130 for copper conductors and IS 5831 for PVC insulation."
  };
}

function generateTransformerDemo(payload: AnalysisPayload): AnalysisResponse {
  return {
    status: "success",
    workflow_mode: payload.workflow_mode || "search",
    notice: "Operating in Offline Demo Mode.",
    query_context: payload,
    primary_standards: [{
      standard_id: "IS 1180 (Part 1)",
      full_title: "Outdoor Type Oil Immersed Distribution Transformers up to and including 2500 kVA, 33 kV Specification Part 1 Mineral Oil Immersed",
      mandatory_qco: true,
      scheme: "Scheme-I (ISI Mark)",
      status: "ACTIVE",
      latest_version: "IS 1180 (Part 1) : 2014",
      similarity: 95.8,
      rrf_score: 0.024
    }],
    candidate_standards: [],
    ecosystem_standards: [
      { standard_id: "IS 335", full_title: "New insulating oils - Specification", relationship_type: "MATERIAL", confidence: "Verified" },
      { standard_id: "IS 2026 (Part 1)", full_title: "Power Transformers - Part 1 : General", relationship_type: "NORMATIVELY_REFERENCES", confidence: "Verified" }
    ],
    certifications: [
      { name: "BIS Product Certification", scheme: "Scheme-I (ISI Mark)", status: "VERIFIED", source_ref: "BIS Catalogue Database" }
    ],
    coverage_alerts: payload.workflow_mode === "audit" ? [
       { standard_id: "IS 335", title: "New insulating oils - Specification", reason: "Required MATERIAL specification for transformer oil is missing.", severity: "high" }
    ] : [],
    draft_tender_clause: "The distribution transformer shall strictly conform to IS 1180 (Part 1) and energy efficiency Level 2. The insulating oil used must comply with IS 335."
  };
}

function generatePumpDemo(payload: AnalysisPayload): AnalysisResponse {
  return {
    status: "success",
    workflow_mode: payload.workflow_mode || "search",
    notice: "Operating in Offline Demo Mode.",
    query_context: payload,
    primary_standards: [{
      standard_id: "IS 6595 (Part 1)",
      full_title: "Centrifugal Pumps for Agricultural Purposes - Specification - Part 1",
      mandatory_qco: true,
      scheme: "Scheme-I (ISI Mark)",
      status: "ACTIVE",
      latest_version: "IS 6595 (Part 1) : 2002",
      similarity: 94.2,
      rrf_score: 0.022
    }],
    candidate_standards: [],
    ecosystem_standards: [
      { standard_id: "IS 11346", full_title: "Methods of tests for agricultural and water supply pumps", relationship_type: "TEST_METHOD", confidence: "Verified" }
    ],
    certifications: [
      { name: "BIS Product Certification", scheme: "Scheme-I (ISI Mark)", status: "VERIFIED", source_ref: "BIS Catalogue Database" }
    ],
    coverage_alerts: payload.workflow_mode === "audit" ? [
       { standard_id: "IS 11346", title: "Methods of tests for agricultural and water supply pumps", reason: "Required TEST_METHOD is missing from the specification.", severity: "high" }
    ] : [],
    draft_tender_clause: "The centrifugal pump must conform to IS 6595 (Part 1). Performance testing must be conducted as per the procedures specified in IS 11346."
  };
}

function generateSolarDemo(payload: AnalysisPayload): AnalysisResponse {
  return {
    status: "success",
    workflow_mode: payload.workflow_mode || "search",
    notice: "Operating in Offline Demo Mode.",
    query_context: payload,
    primary_standards: [{
      standard_id: "IS 14286",
      full_title: "Crystalline Silicon Terrestrial Photovoltaic (PV) Modules - Design Qualification and Type Approval",
      mandatory_qco: true,
      scheme: "CRS",
      status: "ACTIVE",
      latest_version: "IS 14286 : 2010",
      similarity: 96.1,
      rrf_score: 0.025
    }],
    candidate_standards: [],
    ecosystem_standards: [
      { standard_id: "IS/IEC 61730 (Part 1)", full_title: "Photovoltaic (PV) Module Safety Qualification Part 1 Requirements for Construction", relationship_type: "SAFETY", confidence: "Verified" },
      { standard_id: "IS/IEC 61730 (Part 2)", full_title: "Photovoltaic (PV) module safety qualification Part 2 Requirements for testing", relationship_type: "TEST_METHOD", confidence: "Verified" }
    ],
    certifications: [
      { name: "Compulsory Registration Scheme (CRS)", scheme: "CRS (MNRE)", status: "VERIFIED", source_ref: "MeitY/MNRE Notification" }
    ],
    coverage_alerts: payload.workflow_mode === "audit" ? [
       { standard_id: "IS/IEC 61730 (Part 1)", title: "PV Module Safety Qualification", reason: "Required SAFETY standard is omitted.", severity: "high" }
    ] : [],
    draft_tender_clause: "Solar PV modules shall conform to design qualification IS 14286 and must comply with safety requirements as per IS/IEC 61730 (Part 1 & 2)."
  };
}
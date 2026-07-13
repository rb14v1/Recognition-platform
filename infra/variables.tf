variable "tenant_id" {
  description = "Azure / cloud tenant identifier used for cost allocation and incident attribution."
  type        = string
}

variable "submission_id" {
  description = "Submission identifier that links the deployment to the originating work item."
  type        = string
}

variable "cost_centre" {
  description = "Cost-centre code used for financial chargeback and automated governance."
  type        = string
}

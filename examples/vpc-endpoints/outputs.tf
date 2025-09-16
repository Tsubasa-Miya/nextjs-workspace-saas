output "vpc_id" {
  value = aws_vpc.this.id
}

output "interface_endpoint_ids" {
  value = [for ep in aws_vpc_endpoint.iface : ep.id]
}

output "s3_gateway_endpoint_id" {
  value = aws_vpc_endpoint.s3.id
}


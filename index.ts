import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as awsx from "@pulumi/awsx";
import * as k8s from "@pulumi/kubernetes";

// Criando modulo vpc 
const vpc = new awsx.ec2.Vpc("Vpc - Pulumi", {numberOfAvailabilityZones: 2, tags: {name: "Pulumi-vpc"}});

// Mostrar a vpc criada
export const vpcID = vpc.id;

// Criando cluster kubernetes
const cluster = new eks.Cluster("cluster-pulumi", {
    vpcId: vpc.id,
    subnetIds: vpc.publicSubnetIds,
    tags: {Name: "pulumi-cluster "},
    desiredCapacity: 2,
    minSize: 2,
    storageClasses: "gp2",
    instanceType: "t2.micro", 

});

// Mostrar as tags dos clusters 
export const clusterName = cluster.core.tags;

// Mostrando os endpoints
export const clusterEndpoint = cluster.core.endpoint;

// Mostrar o meu Kubeconfig para conectar no cluster
export const kuberConfig = cluster.kubeconfig;

const name = "fcapp"
const appLabels = {appClass: name};
const deployment = new k8s.apps.v1.Deployment(name, {
    metadata: {
        labels: appLabels,

    },

    spec: {
        selector: { matchLabels: appLabels},
        replicas: 1,
        template: {
            metadata: {
                labels: appLabels,
            },
            spec: {
                containers: [
                    {
                        name: name,
                        image: "wesleywillians/domingao-fc",
                        ports: [{containerPort: 8080}],
                    },
                ],
            },
        },
    },
}, {provider: cluster.provider});

const service = new k8s.core.v1.Service(name, {
    metadata: {
        labels: appLabels,
    },
    spec: {
        type: "LoadBalancer",
        ports: [{ port: 80, targetPort: 8080}],
        selector: appLabels,
    }
}, { provider: cluster.provider });

export const serviceHostName = service.status.loadBalancer.ingress[0].hostname;














config:
	kubectl create configmap vsnet --from-file vsnet.yml --dry-run -o yaml | kubectl apply -f -
	kubectl label configmap vsnet app=vsnet

get-config:
	kubectl get configmap vsnet -o yaml

delete-config:
	kubectl delete configmap vsnet

server-key:
	openssl rand -hex 64 | base64 | tr -d '\n' | xargs -I % kubectl create secret generic vsnet-server-key --from-literal key=% --dry-run -o yaml | kubectl apply -f -
	kubectl label secret vsnet-server-key app=vsnet

get-server-key:
	kubectl describe secret vsnet-server-key

delete-server-key:
	kubectl delete secret vsnet-server-key

# delete the redis pods so that they are recreated
redeploy-orchestrator-redis:
	kubectl get pods --selector=app=orchestrator-redis | grep orchestrator-redis | awk '{ print $$1 }' | xargs kubectl delete pod
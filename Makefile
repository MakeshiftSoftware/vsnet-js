deploy-orchestrator-redis:
	kubectl apply -f orchestrator/kubernetes/redis.yml

deploy-matchmaker-redis:
	kubectl apply -f matchmaker/kubernetes/redis.yml

# delete the redis pods so that they are recreated
redeploy-orchestrator-redis:
	kubectl get pods --selector=app=orchestrator-redis | grep orchestrator-redis | awk '{ print $$1 }' | xargs kubectl delete pod
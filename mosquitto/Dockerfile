FROM eclipse-mosquitto:2

COPY ./mosquitto/config/mosquitto.conf /mosquitto/config/mosquitto.conf
COPY ./mosquitto/config/passwd /mosquitto/config/passwd

RUN chown mosquitto:mosquitto /mosquitto/config/mosquitto.conf
RUN chown mosquitto:mosquitto /mosquitto/config/passwd
 
RUN chmod 0644 /mosquitto/config/mosquitto.conf
RUN chmod 0600 /mosquitto/config/passwd